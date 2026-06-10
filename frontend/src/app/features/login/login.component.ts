import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <span class="brand-icon">⬡</span>
          <h1>SpectraFlow</h1>
          <p>{{ isSignUp ? 'Create your account' : 'Sign in to your account' }}</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form">
          <div class="field">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="researcher@institution.edu"
              autocomplete="email"
            />
          </div>

          <div class="field">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="••••••••"
              autocomplete="current-password"
            />
          </div>

          <div *ngIf="errorMsg" class="error-msg">{{ errorMsg }}</div>
          <div *ngIf="successMsg" class="success-msg">{{ successMsg }}</div>

          <button type="submit" class="btn-submit" [disabled]="loading">
            {{ loading ? 'Please wait…' : (isSignUp ? 'Create Account' : 'Sign In') }}
          </button>
        </form>

        <div class="login-footer">
          <ng-container *ngIf="isSignUp; else signInLink">
            Already have an account?
            <a routerLink="/login">Sign in</a>
          </ng-container>
          <ng-template #signInLink>
            Don't have an account?
            <a routerLink="/login" [queryParams]="{ mode: 'signup' }">Sign up</a>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: calc(100vh - 60px);
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F5F5F5;
      padding: 2rem;
    }

    .login-card {
      background: #fff;
      border-radius: 12px;
      padding: 2.5rem;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;

      .brand-icon {
        font-size: 2.5rem;
        color: #1D9E75;
        display: block;
        margin-bottom: 0.5rem;
      }

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #111827;
        margin: 0 0 0.25rem;
      }

      p {
        font-size: 0.875rem;
        color: #6B7280;
        margin: 0;
      }
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;

      label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
      }

      input {
        padding: 0.625rem 0.875rem;
        border: 1px solid #D1D5DB;
        border-radius: 6px;
        font-size: 0.9375rem;
        outline: none;
        transition: border-color 0.15s;

        &:focus {
          border-color: #1D9E75;
          box-shadow: 0 0 0 3px rgba(29, 158, 117, 0.12);
        }
      }
    }

    .error-msg {
      padding: 0.625rem 0.875rem;
      background: #FEF2F2;
      border: 1px solid #FECACA;
      border-radius: 6px;
      font-size: 0.875rem;
      color: #991B1B;
    }

    .success-msg {
      padding: 0.625rem 0.875rem;
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      border-radius: 6px;
      font-size: 0.875rem;
      color: #166534;
    }

    .btn-submit {
      padding: 0.75rem;
      background: #1D9E75;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;

      &:hover:not(:disabled) {
        background: #17836A;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .login-footer {
      margin-top: 1.5rem;
      text-align: center;
      font-size: 0.875rem;
      color: #6B7280;

      a {
        color: #1D9E75;
        text-decoration: none;
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  form: FormGroup;
  isSignUp = false;
  loading = false;
  errorMsg = '';
  successMsg = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.isSignUp = params['mode'] === 'signup';
    });
  }

  async onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';

    const { email, password } = this.form.value;

    try {
      if (this.isSignUp) {
        await this.authService.signUp(email, password);
        this.successMsg = 'Account created! Check your email to confirm your address.';
      } else {
        await this.authService.signIn(email, password);
        this.router.navigate(['/designer']);
      }
    } catch (err: any) {
      this.errorMsg = err?.message || 'Authentication failed. Please try again.';
    } finally {
      this.loading = false;
    }
  }
}
