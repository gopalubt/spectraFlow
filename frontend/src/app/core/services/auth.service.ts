import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _currentUser$ = new BehaviorSubject<User | null>(null);
  readonly currentUser$ = this._currentUser$.asObservable();

  constructor(private supabaseService: SupabaseService) {
    // Initialise from any existing session
    this.supabaseService.supabase.auth.getSession().then(({ data }) => {
      this._currentUser$.next(data.session?.user ?? null);
    });

    // Subscribe to future auth state changes
    this.supabaseService.supabase.auth.onAuthStateChange((_event, session) => {
      this._currentUser$.next(session?.user ?? null);
    });
  }

  isLoggedIn(): boolean {
    return this._currentUser$.value !== null;
  }

  getCurrentUser(): User | null {
    return this._currentUser$.value;
  }

  async getAccessToken(): Promise<string | null> {
    const { data } = await this.supabaseService.supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabaseService.supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabaseService.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabaseService.supabase.auth.signOut();
    if (error) throw error;
  }
}
