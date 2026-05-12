import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth } from './auth';


@Injectable({
  providedIn: 'root',
})
export class Api {

  private apiUrl = 'http://20.80.73.232/api/';

  constructor(private http: HttpClient, private auth: Auth) {}

  private authHeaders() {
    const token = this.auth.getToken();
    let headers = new HttpHeaders();
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return { headers };
  }

  getFeed() {
    return this.http.get<any>(this.apiUrl + 'posts', this.authHeaders());
  }

  getFriends() {
    return this.http.get<any>(this.apiUrl + 'friends', this.authHeaders());
  }

  likePost(id: number) {
    return this.http.post(this.apiUrl + `posts/${id}/like`, {}, this.authHeaders());
  }

  createPost(file: File, caption: string) {
    const fd = new FormData();
    fd.append('image', file);
    fd.append('caption', caption);
    return this.http.post(this.apiUrl + 'posts', fd, this.authHeaders());
  }

  commentPost(postId: number, content: string) {
    return this.http.post(
      this.apiUrl + `posts/${postId}/comments`,
      { content },
      this.authHeaders()
    );
  }

  getComments(postId: number) {
    return this.http.get<any[]>(
      this.apiUrl + `posts/${postId}/comments`,
      this.authHeaders()
    );
  }

  sendFriendRequest(userId: number) {
    return this.http.post(this.apiUrl + `users/${userId}/friend`, {}, this.authHeaders());
  }

  getPendingFriendRequests() {
    return this.http.get<any>(this.apiUrl + `friendships/pending`, this.authHeaders());
  }

  acceptFriendship(friendshipId: number) {
    return this.http.post(this.apiUrl + `friendships/${friendshipId}/accept`, {}, this.authHeaders());
  }

  searchUsers(q: string) {
    return this.http.get<any[]>(this.apiUrl + `users/search?q=${q}`, this.authHeaders());
}

}
