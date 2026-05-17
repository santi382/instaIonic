import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonIcon, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { sendOutline, imageOutline, micOutline, stopOutline } from 'ionicons/icons';
import { ActivatedRoute } from '@angular/router';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonIcon, IonButton, FormsModule, CommonModule]
})
export class ChatPage implements OnInit, OnDestroy {

  userId: number = 0;
  userName: string = '';
  messages: any[] = [];
  newMessage = '';
  currentUserId: number = 0;
  base = 'http://20.80.73.232:8080/storage/';
  private interval: any;

  isRecording = false;
  mediaRecorder: any = null;
  audioChunks: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private api: Api,
    private auth: Auth
  ) {
    addIcons({ sendOutline, imageOutline, micOutline, stopOutline });
  }

  ngOnInit() {
    this.userId = Number(this.route.snapshot.paramMap.get('id'));
    this.userName = this.route.snapshot.queryParamMap.get('name') || 'Usuario';
    this.loadCurrentUser();
    this.loadMessages();
    this.interval = setInterval(() => this.loadMessages(), 3000);
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  loadCurrentUser() {
    this.api.getMe().subscribe(res => this.currentUserId = res.id);
  }

  loadMessages() {
    this.api.getMessages(this.userId).subscribe(res => this.messages = res);
  }

  send() {
    if (!this.newMessage.trim()) return;
    this.api.sendMessage(this.userId, this.newMessage).subscribe(() => {
      this.newMessage = '';
      this.loadMessages();
    });
  }

  sendImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        this.api.sendMessageFile(this.userId, file).subscribe(() => this.loadMessages());
      }
    };
    input.click();
  }

  async startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream);
    this.audioChunks = [];
    this.mediaRecorder.ondataavailable = (e: any) => this.audioChunks.push(e.data);
    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
      const file = new File([blob], 'audio.webm', { type: 'audio/webm' });
      this.api.sendMessageFile(this.userId, file).subscribe(() => this.loadMessages());
    };
    this.mediaRecorder.start();
    this.isRecording = true;
  }

  stopRecording() {
    this.mediaRecorder.stop();
    this.isRecording = false;
  }

  avatarLetter(u: any): string {
    const name = u?.profile?.username || u?.name || '?';
    return name.charAt(0).toUpperCase();
  }

  isOwn(msg: any): boolean {
    return msg.sender_id === this.currentUserId;
  }

  fileUrl(path: string) { return this.base + path; }
}