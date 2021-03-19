import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as base64 from 'base64-arraybuffer';
import * as tf from '@tensorflow/tfjs';


@Component({
  selector: 'app-eyeballer',
  templateUrl: './eyeballer.component.html',
  styleUrls: ['./eyeballer.component.scss']
})
export class EyeBallerComponent implements OnInit {

  offset = tf.scalar(127.5);
  images = new Map<string, File>();
  confidence = 0.6;

  // imageFiles: File[] = [];

  width = 1920;
  height = 1080;

  tfFilesCompleted = false;
  tfFiles: File[] = [];

  eyeballing = false;
  eyeballCompleted = false;
  classifications = {
    custom404: [],
    loginPage: [],
    homePage: [],
    oldLooking: [],
  };

  constructor() {}

  ngOnInit() {
    this.fetchTfFiles();
  }

  get imageFiles(): File[] {
    return Array.from(this.images.values());
  }

  onSelect(event) {
    console.log(event);
    event.addedFiles.forEach((file: File) => {
      this.images.set(file.name, file);
    });
  }

  onRemove(event) {
    console.log('Remove:');
    console.log(event);
  }

  async fetchTfFiles() {
    let resp = await fetch('/assets/tf/model.json');
    const manifest = await resp.json();
    const paths: string[] = Array.from(manifest.weightsManifest[0]?.paths);

    this.tfFiles = [];
    resp = await fetch('/assets/tf/model.json');
    const blob = await resp.blob();
    this.tfFiles.push(new File([blob], 'model.json'));
    await Promise.all(paths.map(async (path) => {
      const tfFile = await this.fetchTfFile(path);
      this.tfFiles.push(tfFile);
    }));
    this.tfFilesCompleted = true;
  }

  async fetchTfFile(name: string): Promise<File> {
    const base = name.split('/').reverse()[0];
    const resp = await fetch(`/assets/tf/${base}`);
    const blob = await resp.blob();
    return new File([blob], base);
  }

  async startEyeball() {
    await this.eyeballScan();
    console.log(this.classifications);
  }

  async eyeballScan(): Promise<void> {
    console.log('eyeballing ...');
    this.eyeballing = true;
    const model = await tf.loadLayersModel(tf.io.browserFiles(this.tfFiles));
    const keys = Array.from(this.images.keys());
    await Promise.all(keys.map((key) => {
      this.classifyImage(key, model);
    }));
    this.eyeballing = false;
    this.eyeballCompleted = true;
  }

  async classifyImage(key: string, model: tf.LayersModel) {
    console.log(`classifying: ${key}`);
    const img = new Image(this.width, this.height);
    img.src = await this.dataURI(this.images.get(key));

    const tensor = tf.browser.fromPixels(img)
      .resizeNearestNeighbor([224, 224])
      .toFloat()
      .sub(this.offset)
      .div(this.offset)
      .expandDims();
    const predictions = (<tf.Tensor<tf.Rank>> model.predict(tensor)).dataSync();
    console.log(`${predictions}`);
    if (predictions[0] > this.confidence) {
      console.log(`Custom 404: ${key}`);
      this.classifications.custom404.push(key);
    }
    if (predictions[1] > this.confidence) {
      console.log(`Login Page: ${key}`);
      this.classifications.loginPage.push(key);
    }
    if (predictions[2] > this.confidence) {
      console.log(`Homepage: ${key}`);
      this.classifications.homePage.push(key);
    }
    if (predictions[3] > this.confidence) {
      console.log(`Old Looking: ${key}`);
      this.classifications.oldLooking.push(key);
    }
  }

  async dataURI(file: File): Promise<string> {
    const buf = await file.arrayBuffer();
    const ext = file.name.split('.').reverse()[0];
    return `data:image/${encodeURIComponent(ext)};base64,${base64.encode(buf)}`;
  }
}
