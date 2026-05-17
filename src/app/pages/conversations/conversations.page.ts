import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Api } from '../../services/api';

@Component({
  selector: 'app-conversations',
  templateUrl: './conversations.page.html',
  styleUrls: ['./conversations.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, CommonModule]
})
export class ConversationsPage implements OnInit {

  users: any[] = [];

  constructor(private api: Api, private router: Router) {}

  ngOnInit() {
    this.api.getConversations().subscribe(res => this.users = res);
  }

  openChat(user: any) {
    this.router.navigateByUrl(`/chat/${user.id}?name=${user.profile?.username || user.name}`);
  }

  avatarLetter(u: any): string {
    const name = u?.profile?.username || u?.name || '?';
    return name.charAt(0).toUpperCase();
  }
}