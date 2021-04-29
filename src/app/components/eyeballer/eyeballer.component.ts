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

  width = 256;
  height = 256;

  tfFilesCompleted = false;
  tfFiles: File[] = [];

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
    console.log(this.classifications);
  }

  async eyeballScan(): Promise<void> {
    console.log('eyeballing ...');
    this.eyeballing = true;
    const model = await tf.loadLayersModel(tf.io.browserFiles(this.tfFiles));
    const keys = Array.from(this.images.keys());
    await Promise.all(keys.map(async (key) => {
      await this.classifyImage(key, model);
      this.eyeballedCount++;
    }));
    console.log('eyeballed all images');
    this.eyeballing = false;
    this.eyeballCompleted = true;
    this.images = null;
  }

  async classifyImage(key: string, model: tf.LayersModel) {
    console.log(`classifying: ${key}`);
    const img = new Image(this.width, this.height);
    img.src = await this.dataURI(this.images.get(key));
    this.dataURIs.set(key, img.src);

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
    const webappCheckBox = document.getElementById("webappCheckBox") as HTMLInputElement;
    var oldLookingCheckBox = document.getElementById("oldLookingCheckBox") as HTMLInputElement;
    var loginCheckBox = document.getElementById("loginCheckBox") as HTMLInputElement;
    var custom404CheckBox = document.getElementById("custom404CheckBox") as HTMLInputElement;
    var parkedCheckBox = document.getElementById("parkedCheckBox") as HTMLInputElement;

    var selectedScreens = [];
    if (webappCheckBox.checked){
      for (let entry of this.classifications.webapp) {
        selectedScreens.push(entry);
      }
    }
    if (oldLookingCheckBox.checked){
      for (let entry of this.classifications.oldLooking) {
        selectedScreens.push(entry);
      }
    }
    if (loginCheckBox.checked){
      for (let entry of this.classifications.loginPage) {
        selectedScreens.push(entry);
      }
    }
    if (custom404CheckBox.checked){
      for (let entry of this.classifications.custom404) {
        selectedScreens.push(entry);
      }
    }
    if (parkedCheckBox.checked){
      for (let entry of this.classifications.parked) {
        selectedScreens.push(entry);
      }
    }

    var str = selectedScreens.join("\n");

    const blob = new Blob([str], { type: 'text/csv' });
    const url= window.URL.createObjectURL(blob);
    window.open(url);
  }
}
