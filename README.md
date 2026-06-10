# SpectraFlow

A web application for biochemistry researchers to design chemical denaturation experiments. SpectraFlow calculates extinction coefficients, working concentrations, stock preparation requirements, and generates a complete experiment grid from a protein FASTA sequence.

---

## Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **Angular CLI** v17: `npm install -g @angular/cli`
- A **Supabase** account (free tier is sufficient): https://supabase.com

---

## 1. Supabase Setup

1. Create a new Supabase project at https://app.supabase.com.
2. Go to **SQL Editor** in the Supabase dashboard.
3. Paste the contents of `supabase/migrations/001_initial_schema.sql` and run it.
4. Under **Project Settings → API**, copy:
   - **Project URL** (e.g. `https://xyz.supabase.co`)
   - **`anon` public key**
   - **`service_role` secret key**

---

## 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and fill in your keys:

```
PORT=3000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_secret_key
FRONTEND_URL=http://localhost:4200
```

Start the development server:

```bash
npm run dev      # uses nodemon for live reload
# or
npm start        # production
```

The API will be available at `http://localhost:3000`.

---

## 3. Frontend Setup

```bash
cd frontend
npm install
```

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  supabaseUrl: 'https://your-project-id.supabase.co',
  supabaseAnonKey: 'your_anon_public_key'
};
```

Start the Angular dev server:

```bash
npm start
```

Open http://localhost:4200 in your browser.

---

## 4. API Endpoints

| Method | Path                    | Auth | Description                       |
|--------|-------------------------|------|-----------------------------------|
| POST   | `/api/sequence/analyse` | No   | Analyse FASTA — returns ε, MW, etc. |
| POST   | `/api/protocol/generate`| No   | Generate full protocol + grid      |
| POST   | `/api/protocol/save`    | Yes  | Save protocol to Supabase          |
| GET    | `/api/protocol/list`    | Yes  | List user's saved protocols        |
| GET    | `/api/protocol/:id`     | Yes  | Retrieve a full saved protocol     |
| GET    | `/api/auth/verify`      | Yes  | Verify JWT and return user info    |
| GET    | `/api/health`           | No   | Health check                       |

---

## 5. BSA Validation Test

Use the BSA sequence from UniProt [P02769](https://www.uniprot.org/uniprot/P02769).

Expected results for BSA:

| Parameter       | Expected value           |
|-----------------|--------------------------|
| Trp (W)         | 2                        |
| Tyr (Y)         | 20                       |
| Cys (C)         | 35                       |
| Disulfide bonds | 17 (⌊35/2⌋)              |
| ε₂₈₀ (M⁻¹cm⁻¹) | 42 925                   |

Calculation:
```
ε = (2 × 5500) + (20 × 1490) + (17 × 125)
  = 11 000 + 29 800 + 2 125
  = 42 925  M⁻¹cm⁻¹   (Pace et al. 1995)
```

To test via curl:

```bash
curl -s -X POST http://localhost:3000/api/sequence/analyse \
  -H "Content-Type: application/json" \
  -d '{"fasta": ">sp|P02769|ALBU_BOVIN\nDAHKSEVAHRFKDLGEENFKALVLIAFAQYLQQCPFEDHVKLVNELTEFAKTCVADESAENCDKSLHTLFGDELCKVASLRETYGDMADCCEKQEPERNECFLSHKDDSPDLPKLKPDPNTLCDEFKADEKKFWGKYLYEIARRHPYFYAPELLYYANKYNGVFQECCQAEDKGACLLPKIETMREKVLASSARQRLRCASIQKFGERALKAWSVARLSQKFPKAEFVEVTKLVTDLTKVHKECCHGDLLECADDRADLAKYICDNQDTISSKLKECCDKPLLEKSHCIAEVEKDAIPENLPPLTADFAEDKDVCKNYAEAKDVFLGMFLYEYARRHPDYSVVLLLRLAKTYETTLEKCCAADDKEACFAVEGPKLVVSTQTALAALKDELHDSELRNPHGHIFSGLYSSCLHKLSNLGVDNESQSYFEDIAGGGGHFDQASAKCKEVVRSIFEQVQSQLCELYNSVCFEKHDKHLFCHSEYFAELKVDKVLHSSERFKKPEEFKNAFLLLSRDQPLSSQELRERNMEQFRSEEEYYAKNFQQFSDPQKENEFLERPVLLRHKDMKKKQEIEDLRSKNEDRIESVAHLKQQFLNSCKAQVDEKMLQSMLKDNITRY"}' \
  | python3 -m json.tool
```

---

## Science References

- **Pace et al. (1995)** — Protein Science 4:2411–2423. Molar extinction coefficient formula.
- **Beer (1852) / Lambert (1760)** — Beer-Lambert law; target absorbance 0.2 AU.
- **Pace (1986)** — Methods Enzymol 131:266–280. Denaturant concentration grid heuristics.
- **Lakowicz (2006)** — Principles of Fluorescence Spectroscopy, 3rd ed., Ch. 16. Trp emission predictions.
- **Gasteiger et al. (2005)** — ExPASy proteomics tools; residue masses.
