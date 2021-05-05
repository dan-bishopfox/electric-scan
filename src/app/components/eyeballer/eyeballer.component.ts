import { Component, OnInit } from '@angular/core';
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
  dataURIs = new Map<string, string>();
  confidence = 0.6;

  width = 224;
  height = 224;

  tfFilesCompleted = false;
  tfFiles: File[] = [];

  loadedCount = 0;
  finishedLoading = false;
  eyeballing = false;
  eyeballCompleted = false;
  eyeballedCount = 0;
  classifications = {
    custom404: [],
    loginPage: [],
    webapp: [],
    oldLooking: [],
    parked: [],
  };

  // What labels are selected?
  selected = {
    custom404: false,
    loginPage: false,
    webapp: true,
    oldLooking: false,
    parked: false,
  }

  selectedScreens = new Set([]);

  constructor() {}

  ngOnInit() {
    this.fetchTfFiles();
  }

  get imageFiles(): File[] {
    return Array.from(this.images.values());
  }

  get selectedScreensArray(): string[] {
    return Array.from(this.selectedScreens);
  }

  async onSelect(event) {
    console.log(event);
    await Promise.all(event.addedFiles.map(async (file) => {
      this.images.set(file.name, file);
    }));
  }

  onRemove(event) {
    this.images.delete(event.name);
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
    await this.updateSelections();
    console.log(this.classifications);
  }

  async updateSelections() {
    this.selectedScreens = new Set([]);
    if (this.selected.webapp){
      for (let entry of this.classifications.webapp) {
        this.selectedScreens.add(entry);
      }
    }
    if (this.selected.oldLooking){
      for (let entry of this.classifications.oldLooking) {
        this.selectedScreens.add(entry);
      }
    }
    if (this.selected.loginPage){
      for (let entry of this.classifications.loginPage) {
        this.selectedScreens.add(entry);
      }
    }
    if (this.selected.custom404){
      for (let entry of this.classifications.custom404) {
        this.selectedScreens.add(entry);
      }
    }
    if (this.selected.parked){
      for (let entry of this.classifications.parked) {
        this.selectedScreens.add(entry);
      }
    }
  }

  async eyeballScan(): Promise<void> {
    console.log('eyeballing ...');
    this.eyeballing = true;
    const model = await tf.loadLayersModel(tf.io.browserFiles(this.tfFiles));
    const keys = Array.from(this.images.keys());
    await Promise.all(keys.map(async (key) => {
      await this.classifyImage(key, model);
    }));
  }

  async classifyImage(key: string, model: tf.LayersModel) {
    const img = new Image(this.width, this.height);
    img.src = await this.dataURI(this.images.get(key));
    console.log("Queued up image: " + key)
    this.loadedCount++;
    img.onload = () => {
      console.log(`classifying: ${key}`);
      this.dataURIs.set(key, img.src);
      const tensor = tf.browser.fromPixels(img)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .sub(this.offset)
        .div(this.offset)
        .expandDims();
      // console.log(img.src);
      // tensor.print();
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
        console.log(`webapp: ${key}`);
        this.classifications.webapp.push(key);
      }
      if (predictions[3] > this.confidence) {
        console.log(`Old Looking: ${key}`);
        this.classifications.oldLooking.push(key);
      }
      if (predictions[4] > this.confidence) {
        console.log(`Parked: ${key}`);
        this.classifications.parked.push(key);
      }
      this.eyeballedCount++;

      if (this.eyeballedCount >= this.images.size) {
        console.log('eyeballed all images');
        this.eyeballing = false;
        this.eyeballCompleted = true;
        this.images = null;
      }
    };
  }

  async dataURI(file: File): Promise<string> {
    const buf = await file.arrayBuffer();
    let ext = file.name.split('.').reverse()[0]?.toLocaleLowerCase();
    if (!["jpg", "jpeg", "png", "gif", "bmp"].some(allow => allow === ext)) {
      console.log(`Unknown file type ${ext}, defaulting to jpg`);
      ext = "jpg";
    }
    return `data:image/${encodeURIComponent(ext)};base64,${base64.encode(buf)}`;
  }

  eyeballPercent() {
    return (this.eyeballedCount / this.images.size) * 100;
  }

  restart() {
    window.location.reload();
  }

  async exportResults() {
    const str = Array.from(this.selectedScreens).join("\n");
    const blob = new Blob([str], { type: 'text/csv' });
    const url= window.URL.createObjectURL(blob);
    window.open(url);
  }
}
