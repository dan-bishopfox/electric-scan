import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
// import { take } from 'rxjs/operators';
import * as tf from '@tensorflow/tfjs';


@Component({
  selector: 'app-eyeballer',
  templateUrl: './eyeballer.component.html',
  styleUrls: ['./eyeballer.component.scss']
})
export class EyeBallerComponent implements OnInit {

  offset = tf.scalar(127.5);
  images = new Map<string, string>();
  confidence = 0.6;

  files: File[];

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

  onSelect(event) {
    console.log(event);
  }

  async fetchTfFiles() {
    const resp = await fetch('/assets/tf/model.json');
    const manifest = await resp.json();
    const paths: string[] = Array.from(manifest.weightsManifest[0]?.paths);
    this.tfFiles = [];
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
    img.src = this.images.get(key);
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
}
