import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonInput, IonButton, IonText,
  IonSegment, IonSegmentButton, IonLabel
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonInput, IonButton, IonText,
    IonSegment, IonSegmentButton, IonLabel,
    FormsModule, CommonModule]
})
export class LoginPage implements OnInit {

  email = ''; password = ''; name = ''; username = ''; isRegister = false; error = '';

  constructor(private auth: Auth, private router: Router) {}

  ngOnInit(): void {}

  submit() {
    if (this.isRegister) {
      this.auth.register({
        name: this.name,
        email: this.email,
        password: this.password,
        username: this.username
      }).subscribe({
        next: res => {
          console.log('REGISTER OK', res);
          if (res && res.token) {
            this.auth.setToken(res.token);
            this.router.navigateByUrl('/feed');
          } else {
            this.error = 'Token no recibido: ' + JSON.stringify(res);
          }
        },
        error: err => {
          console.log('REGISTER ERROR', err);
          this.error = 'No se pudo registrar: ' + err.status;
        }
      });
    } else {
      this.auth.login(this.email, this.password).subscribe({
        next: res => {
          console.log('LOGIN OK', res);
          if (res && res.token) {
            this.auth.setToken(res.token);
            this.router.navigateByUrl('/feed');
          } else {
            this.error = 'Token no recibido: ' + JSON.stringify(res);
          }
        },
        error: err => {
          console.log('LOGIN ERROR', err);
          this.error = 'Error: ' + err.status;
        }
      });
    }
  }
}