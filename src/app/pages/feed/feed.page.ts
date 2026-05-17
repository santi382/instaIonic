import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonAvatar, IonLabel, IonButton, IonButtons, IonInput, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, exitOutline, personAdd, chatbubbleOutline, searchOutline, checkmarkOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-feed',
  templateUrl: './feed.page.html',
  styleUrls: ['./feed.page.scss'],
  standalone: true,
  imports: [IonInput, IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonAvatar, IonLabel, IonButton, IonButtons,
    FormsModule, CommonModule, IonIcon]
})
export class FeedPage implements OnInit {

  posts: any[] = [];
  friends: any[] = [];
  base = 'http://20.80.73.232:8080/storage/';

  selectedPost: any = null;
  newComment = '';
  comments: any[] = [];
  showComments = false;

  searchQuery = '';
  searchResults: any[] = [];
  showSearch = false;

  pendingRequests: any[] = [];
  showPending = false;

  showUserPosts = false;
  userPosts: any[] = [];
  selectedUser: any = null;
  storyIndex = 0;
  hideHeader = false;

  likedPosts: Set<number> = new Set(JSON.parse(localStorage.getItem('likedPosts') || '[]'));

  constructor(
    private api: Api,
    private router: Router,
    private auth: Auth,
  ) {
    addIcons({ cameraOutline, personAdd, exitOutline, chatbubbleOutline, searchOutline, checkmarkOutline });
  }

  ngOnInit() { this.load(); }

  load() {
    this.api.getFeed().subscribe(res => this.posts = res.data ?? res);
    this.api.getFriends().subscribe(res => this.friends = res.data ?? res);
    this.api.getPendingFriendRequests().subscribe(res => this.pendingRequests = res.data ?? res);
  }

  like(p: any) {
    this.api.likePost(p.id).subscribe(() => {
      this.likedPosts.add(p.id);
      localStorage.setItem('likedPosts', JSON.stringify([...this.likedPosts]));
      this.playLikeSound();
      this.showHeartAnimation(p.id);
      this.load();
    });
  }

  playLikeSound() {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }

  showHeartAnimation(postId: number) {
    const el = document.getElementById('heart-' + postId);
    if (el) {
      el.classList.remove('heart-animate');
      void el.offsetWidth;
      el.classList.add('heart-animate');
      setTimeout(() => el.classList.remove('heart-animate'), 800);
    }
  }

  goNewPost() { this.router.navigateByUrl('/new-post'); }
  goConversations() { this.router.navigateByUrl('/conversations'); }
  goChat(friend: any) {
    this.router.navigateByUrl(`/chat/${friend.id}?name=${friend.profile?.username || friend.name}`);
  }

  imgUrl(path: string) { return this.base + path; }

  avatarLetter(u: any): string {
    const name = u?.profile?.username || u?.name || '?';
    return name.charAt(0).toUpperCase();
  }

  isAlreadyFriend(user: any): boolean {
    return this.friends.some(f => f.id === user.id);
  }

  openComments(p: any) {
    this.selectedPost = p;
    this.showComments = true;
    this.api.getComments(p.id).subscribe(res => this.comments = res);
  }

  sendComment() {
    if (!this.selectedPost || !this.newComment.trim()) return;
    this.api.commentPost(this.selectedPost.id, this.newComment).subscribe(res => {
      this.comments.unshift(res);
      this.newComment = '';
      this.playCommentSound();
    });
  }

  playCommentSound() {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  closeComments() {
    this.showComments = false;
    this.selectedPost = null;
    this.comments = [];
    this.newComment = '';
  }

  onSearch() {
    if (!this.searchQuery.trim()) { this.searchResults = []; return; }
    this.api.searchUsers(this.searchQuery).subscribe(res => this.searchResults = res);
  }

  sendRequest(user: any) {
    this.api.sendFriendRequest(user.id).subscribe(() => {
      user.requested = true;
    });
  }

  acceptRequest(req: any) {
    this.api.acceptFriendship(req.id).subscribe(() => this.load());
  }

  openUserPosts(friend: any) {
    this.selectedUser = friend;
    this.showUserPosts = true;
    this.storyIndex = 0;
    this.hideHeader = true;
    this.api.getFeed().subscribe(res => {
      const all = res.data ?? res;
      this.userPosts = all.filter((p: any) => p.user_id === friend.id);
    });
  }

  closeStory() {
    this.showUserPosts = false;
    this.hideHeader = false;
  }

  nextStory() {
    if (this.storyIndex < this.userPosts.length - 1) this.storyIndex++;
  }

  prevStory() {
    if (this.storyIndex > 0) this.storyIndex--;
  }

  logout() {
    this.auth.logoutRemote()?.subscribe({
      next: () => { this.auth.logout(); this.router.navigateByUrl('/login', { replaceUrl: true }); },
      error: () => { this.auth.logout(); this.router.navigateByUrl('/login', { replaceUrl: true }); }
    });
  }
}