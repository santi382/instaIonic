import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonInput, IonButton, IonImg, IonButtons, IonBackButton, IonIcon, IonCol, IonGrid, IonRow } from '@ionic/angular/standalone';
import { Api } from '../../services/api';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { addIcons } from 'ionicons';
import { camera, fileTray, cloudUpload } from 'ionicons/icons';

@Component({
  selector: 'app-new-post',
  templateUrl: './new-post.page.html',
  styleUrls: ['./new-post.page.scss'],
  standalone: true,
  imports: [IonRow, IonGrid, IonCol, IonIcon, IonBackButton, IonImg, IonHeader,
    IonToolbar, IonTitle, IonContent, IonItem, IonInput, IonButton, FormsModule, IonButtons, CommonModule]
})
export class NewPostPage implements OnInit {

  caption = '';
  file?: File;
  preview?: string;

  constructor(private api: Api, private router: Router) {
    addIcons({ camera, fileTray, cloudUpload });
  }

  ngOnInit() {}

  onFileChange(ev: any) {
    const f = ev.target.files[0];
    if (f) {
      this.file = f;
      this.preview = URL.createObjectURL(f);
    }
  }

  upload() {
    if (!this.file) return;
    this.api.createPost(this.file, this.caption).subscribe(() => {
      this.router.navigateByUrl('/feed');
    });
  }

  async takePhoto() {
    const isWeb = !('Capacitor' in window) || (window as any).Capacitor?.isNativePlatform() === false;

    if (isWeb) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;object-fit:cover;background:black;';
        document.body.appendChild(video);

        const btn = document.createElement('button');
        btn.innerText = '📸 Capturar';
        btn.style.cssText = 'position:fixed;bottom:40px;left:50%;transform:translateX(-50%);z-index:10000;padding:14px 32px;background:#0d2d5e;color:white;border:none;border-radius:12px;font-size:18px;cursor:pointer;';
        document.body.appendChild(btn);

        const closeBtn = document.createElement('button');
        closeBtn.innerText = '✕';
        closeBtn.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;padding:10px 16px;background:rgba(0,0,0,0.5);color:white;border:none;border-radius:50%;font-size:20px;cursor:pointer;';
        document.body.appendChild(closeBtn);

        btn.onclick = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d')!.drawImage(video, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg');
          this.preview = dataUrl;
          this.file = this.dataUrlToFile(dataUrl, 'photo.jpg');
          stream.getTracks().forEach(t => t.stop());
          document.body.removeChild(video);
          document.body.removeChild(btn);
          document.body.removeChild(closeBtn);
        };

        closeBtn.onclick = () => {
          stream.getTracks().forEach(t => t.stop());
          document.body.removeChild(video);
          document.body.removeChild(btn);
          document.body.removeChild(closeBtn);
        };

      } catch (e) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (ev: any) => {
          const f = ev.target.files[0];
          if (f) { this.file = f; this.preview = URL.createObjectURL(f); }
        };
        input.click();
      }
      return;
    }

    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });
      this.preview = photo.dataUrl || undefined;
      if (photo.dataUrl) this.file = this.dataUrlToFile(photo.dataUrl, 'photo.jpg');
    } catch (e) {
      console.error('Camera error:', e);
    }
  }

  private dataUrlToFile(dataUrl: string, filename: string): File {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  }
}