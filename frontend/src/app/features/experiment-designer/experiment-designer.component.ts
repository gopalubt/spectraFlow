import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SequenceService } from '../../core/services/sequence.service';
import { AuthService } from '../../core/services/auth.service';
import { Protocol, ExperimentStep } from '../../shared/models/protocol.model';

@Component({
  selector: 'app-experiment-designer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './experiment-designer.component.html',
  styleUrls: ['./experiment-designer.component.scss']
})
export class ExperimentDesignerComponent {
  form: FormGroup;
  protocol: Protocol | null = null;
  loading = false;
  saving = false;
  errorMsg = '';
  saveSuccess = '';
  savedId = '';

  constructor(
    private fb: FormBuilder,
    private sequenceService: SequenceService,
    public authService: AuthService
  ) {
    this.form = this.fb.group({
      fasta: ['', Validators.required],
      proteinName: [''],
      denaturantType: ['urea'],
      stepSize: [0.5, [Validators.required, Validators.min(0.1)]],
      cuvVolumeUl: [1000, [Validators.required, Validators.min(1)]],
      stockMultiplier: [10, [Validators.required, Validators.min(2)]],
      replicates: [1, [Validators.required, Validators.min(1)]],
      safetyMargin: [0.2, [Validators.required, Validators.min(0)]],
      proteinForm: ['powder']
    });
  }

  generate() {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';
    this.protocol = null;
    this.saveSuccess = '';

    this.sequenceService.generateProtocol(this.form.value).subscribe({
      next: (result) => {
        this.protocol = result;
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = err?.error?.error || 'Failed to generate protocol. Please check your FASTA input.';
        this.loading = false;
      }
    });
  }

  save() {
    if (!this.protocol) return;
    this.saving = true;
    this.saveSuccess = '';

    this.sequenceService.saveProtocol(this.protocol).subscribe({
      next: (res) => {
        this.savedId = res.id;
        this.saveSuccess = `Protocol saved (ID: ${res.id.slice(0, 8)}…)`;
        this.saving = false;
      },
      error: (err) => {
        this.errorMsg = err?.error?.error || 'Failed to save protocol. Are you signed in?';
        this.saving = false;
      }
    });
  }

  flagClass(flag: string): string {
    if (flag === 'focus') return 'badge badge-focus';
    if (flag === 'caution') return 'badge badge-caution';
    return 'badge badge-run';
  }

  focusSteps(): ExperimentStep[] {
    return this.protocol?.experimentGrid.filter(s => s.flag === 'focus') ?? [];
  }

  cautionSteps(): ExperimentStep[] {
    return this.protocol?.experimentGrid.filter(s => s.flag === 'caution') ?? [];
  }

  formatNum(n: number | undefined, decimals = 2): string {
    if (n === undefined || n === null) return '—';
    return n.toFixed(decimals);
  }
}
