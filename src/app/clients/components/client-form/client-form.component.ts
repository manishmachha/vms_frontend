import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ClientService } from '../../../services/client.service';
import { Client } from '../../../models/client.model';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule, // Kept for mat-dialog-close directive
  ],
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.css'],
})
export class ClientFormComponent {
  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);

  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<ClientFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Client | undefined,
  ) {
    this.form = this.fb.group({
      name: [data?.name || '', Validators.required],
      industry: [data?.industry || ''],
      email: [data?.email || '', [Validators.email]],
      phone: [data?.phone || '', [Validators.maxLength(10)]],
      city: [data?.city || ''],
      country: [data?.country || ''],
      website: [data?.website || ''],
      address: [data?.address || ''],
      description: [data?.description || ''],
      status: [data?.status || 'ACTIVE'],
    });
  }

  save() {
    if (this.form.valid) {
      const clientData = this.form.value;
      if (this.data) {
        this.clientService.updateClient(this.data.id, clientData).subscribe(() => {
          this.dialogRef.close(true);
        });
      } else {
        this.clientService.createClient(clientData).subscribe(() => {
          this.dialogRef.close(true);
        });
      }
    }
  }
}
