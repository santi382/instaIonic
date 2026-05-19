import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonButton } from '@ionic/angular/standalone';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonButton, FormsModule, CommonModule]
})
export class ProfilePage implements OnInit {

  user: any = null;
  name = '';
  username = '';
  bio = '';
  pronouns = '';
  gender = '';
  website = '';
  posts: any[] = [];
  base = 'http://20.80.73.232:8080/storage/';
  editMode = false;
  successMsg = '';
  showAvatarOptions = false;
  avatarPreview: string | null = null;
  bannerPreview: string | null = null;

  constructor(private api: Api, private auth: Auth, private router: Router) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.api.getMe().subscribe(res => {
      this.user = res;
      this.name = res.name;
      this.username = res.profile?.username || '';
      this.bio = res.profile?.bio || '';
      this.pronouns = res.profile?.pronouns || '';
      this.gender = res.profile?.gender || '';
      this.website = res.profile?.website || '';
      this.avatarPreview = res.profile?.avatar ? this.base + res.profile.avatar : null;
      this.bannerPreview = res.profile?.banner ? this.base + res.profile.banner : null;
    });
    this.api.getFeed().subscribe(res => {
      const all = res.data ?? res;
      this.api.getMe().subscribe(me => {
        this.posts = all.filter((p: any) => p.user_id === me.id);
      });
    });
  }

  async takeAvatarPhoto() {
    this.showAvatarOptions = false;
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
          stream.getTracks().forEach(t => t.stop());
          document.body.removeChild(video);
          document.body.removeChild(btn);
          document.body.removeChild(closeBtn);
          const file = this.dataUrlToFile(dataUrl, 'avatar.jpg');
          this.uploadAvatar(file);
        };
        closeBtn.onclick = () => {
          stream.getTracks().forEach(t => t.stop());
          document.body.removeChild(video);
          document.body.removeChild(btn);
          document.body.removeChild(closeBtn);
        };
      } catch (e) {
        this.selectAvatarFromGallery();
      }
      return;
    }
    try {
      const photo = await Camera.getPhoto({ quality: 80, resultType: CameraResultType.DataUrl, source: CameraSource.Camera });
      if (photo.dataUrl) {
        const file = this.dataUrlToFile(photo.dataUrl, 'avatar.jpg');
        this.uploadAvatar(file);
      }
    } catch (e) { console.error(e); }
  }

  selectAvatarFromGallery() {
    this.showAvatarOptions = false;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (ev: any) => {
      const file = ev.target.files[0];
      if (file) this.uploadAvatar(file);
    };
    input.click();
  }

  uploadAvatar(file: File) {
    this.avatarPreview = URL.createObjectURL(file);
    this.api.updateAvatar(file).subscribe(() => this.loadProfile());
  }

  selectBanner() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (ev: any) => {
      const file = ev.target.files[0];
      if (file) {
        this.bannerPreview = URL.createObjectURL(file);
        this.api.updateBanner(file).subscribe(() => this.loadProfile());
      }
    };
    input.click();
  }

  saveProfile() {
    this.api.updateProfile({
      name: this.name,
      username: this.username,
      bio: this.bio,
      pronouns: this.pronouns,
      gender: this.gender,
      website: this.website
    }).subscribe(() => {
      this.successMsg = 'Perfil actualizado ✓';
      this.editMode = false;
      this.loadProfile();
      setTimeout(() => this.successMsg = '', 3000);
    });
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

  imgUrl(path: string) { return this.base + path; }

  avatarLetter(): string {
    const name = this.username || this.name || '?';
    return name.charAt(0).toUpperCase();
  }

  logout() {
    this.auth.logoutRemote()?.subscribe({
      next: () => { this.auth.logout(); this.router.navigateByUrl('/login', { replaceUrl: true }); },
      error: () => { this.auth.logout(); this.router.navigateByUrl('/login', { replaceUrl: true }); }
    });
  }
}