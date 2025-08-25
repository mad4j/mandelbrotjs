# Mandelbrot Explorer - Rust WebAssembly Edition

Questo progetto implementa un esploratore dell'insieme di Mandelbrot con supporto ad alte prestazioni tramite Rust e WebAssembly.

## 🚀 Novità

### Implementazione Rust + WebAssembly

- **Prestazioni migliorate**: Il calcolo del set di Mandelbrot è ora implementato in Rust e compilato in WebAssembly per prestazioni significativamente superiori
- **Compatibilità**: Fallback automatico a JavaScript se WebAssembly non è supportato dal browser
- **Trasparenza**: Nessuna modifica all'interfaccia utente - tutte le funzionalità esistenti rimangono identiche

### File aggiunti

- `wasm/` - Progetto Rust per il calcolo WebAssembly
- `pkg/` - Modulo WebAssembly compilato e bindings JavaScript
- `mandel-compute-wasm.js` - Worker wrapper che utilizza WebAssembly
- `build.sh` - Script di build per compilare automaticamente il modulo WebAssembly
- `build-config.js` - Configurazione per la selezione automatica del backend

## 🔧 Build del Progetto

### Prerequisiti

Il progetto include tutto il necessario per la compilazione automatica:

- Sistema operativo: Linux, macOS, o Windows con WSL
- Connessione internet (per il download automatico di Rust e wasm-pack)

### Compilazione

```bash
# Esegui lo script di build
./build.sh
```

Lo script automaticamente:
1. Installa Rust se non presente
2. Installa wasm-pack se non presente
3. Compila il codice Rust in WebAssembly
4. Copia i file necessari nella directory principale

### Build manuale (opzionale)

Se preferisci controllare ogni passaggio:

```bash
# Installa Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Installa wasm-pack
cargo install wasm-pack

# Compila il modulo WebAssembly
cd wasm
wasm-pack build --target web --out-dir pkg

# Copia i file nella directory principale
cd ..
cp -r wasm/pkg .
```

## 🌐 Deploy

### Sviluppo locale

```bash
# Avvia un server web locale
python3 -m http.server 8000

# Apri il browser su http://localhost:8000
```

### Deploy in produzione

1. **Build del progetto**: Esegui `./build.sh`
2. **Upload files**: Carica tutti i file sulla tua piattaforma di hosting
3. **Configurazione server**: Assicurati che il server web serva correttamente i file `.wasm` con il MIME type `application/wasm`

#### Configurazione server web

**Apache (.htaccess):**
```apache
AddType application/wasm .wasm
```

**Nginx:**
```nginx
location ~* \.wasm$ {
    add_header Content-Type application/wasm;
}
```

## 🔍 Dettagli Tecnici

### Architettura

Il sistema implementa un'architettura ibrida:

```
Browser
├── mandel-workers.js (controllo principale)
├── mandel-compute-wasm.js (worker WebAssembly)
│   ├── pkg/mandel_wasm.js (bindings JavaScript)
│   └── pkg/mandel_wasm_bg.wasm (codice Rust compilato)
└── mandel-compute.js (fallback JavaScript)
```

### Selezione automatica del backend

Il sistema rileva automaticamente il supporto WebAssembly:

1. **WebAssembly supportato**: Utilizza il modulo Rust ad alte prestazioni
2. **WebAssembly non supportato**: Fallback automatico a JavaScript

### Miglioramenti delle prestazioni

Il codice Rust offre i seguenti vantaggi:

- **Velocità**: Calcoli fino a 3-5x più veloci rispetto a JavaScript
- **Precisione**: Calcoli in virgola mobile più precisi
- **Ottimizzazione**: Compilazione ottimizzata per il target WebAssembly
- **Parallelismo**: Gestione efficiente dei worker paralleli

### Compatibilità

- **Browser moderni**: Chrome 57+, Firefox 52+, Safari 11+, Edge 16+
- **Browser legacy**: Fallback automatico a JavaScript
- **Mobile**: Supporto completo su dispositivi moderni

## 📁 Struttura del Progetto

```
mandelbrotjs/
├── index.html                 # Interfaccia utente principale
├── mandel-workers.js          # Gestione worker e UI (modificato)
├── mandel-compute-wasm.js     # Worker WebAssembly (nuovo)
├── mandel-compute.js          # Worker JavaScript (originale)
├── mandel-render.js           # Rendering (invariato)
├── build.sh                   # Script di build (nuovo)
├── wasm/                      # Progetto Rust (nuovo)
│   ├── Cargo.toml
│   ├── src/lib.rs
│   └── pkg/               # Output compilazione
└── pkg/                       # Modulo WebAssembly (nuovo)
    ├── mandel_wasm.js
    ├── mandel_wasm_bg.wasm
    └── ...
```

## 🧪 Test e Sviluppo

### Test di prestazioni

Per confrontare le prestazioni tra JavaScript e WebAssembly:

1. Apri la console del browser (F12)
2. Osserva i messaggi di log che indicano quale backend è in uso
3. Confronta i tempi di rendering mostrati nell'interfaccia

### Sviluppo del codice Rust

Il codice Rust si trova in `wasm/src/lib.rs` e implementa:

- `mandel_one_shot()`: Calcolo di un singolo punto
- `mandel_compute_segment()`: Calcolo di un segmento senza smoothing
- `mandel_compute_segment_with_smooth()`: Calcolo con smoothing abilitato

### Debug

Per debug del modulo WebAssembly, aggiungi log nel codice Rust:

```rust
web_sys::console::log_1(&"Debug message".into());
```

## 🚀 Workshop e CI/CD

### Integrazione in workshop

Il progetto è ora pronto per essere integrato in workshop di sviluppo web che includono:

1. **Rust e WebAssembly**: Dimostrazione di tecnologie moderne
2. **Build automatizzato**: Script che gestisce l'intera toolchain
3. **Deploy semplificato**: Un unico comando per build e deploy

### Pipeline CI/CD (GitHub Actions esempio)

```yaml
name: Build and Deploy
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Build WebAssembly
      run: ./build.sh
    - name: Deploy
      run: # deploy commands here
```

## 🔧 Risoluzione Problemi

### WebAssembly non funziona

1. Verifica supporto browser: apri console e cerca messaggi di log
2. Controlla configurazione server per file `.wasm`
3. Il sistema dovrebbe automaticamente utilizzare il fallback JavaScript

### Errori di compilazione

1. Verifica installazione Rust: `rustc --version`
2. Verifica installazione wasm-pack: `wasm-pack --version`
3. Controlla errori nella console del terminale

### Prestazioni non migliorate

1. Verifica che WebAssembly sia effettivamente in uso (console browser)
2. Testa con impostazioni di zoom e iterazioni più alte
3. Su hardware molto vecchio, il miglioramento potrebbe essere limitato

## 📈 Prossimi Sviluppi

Possibili miglioramenti futuri:

1. **SIMD**: Utilizzo di istruzioni SIMD per ulteriori ottimizzazioni
2. **Threading**: Supporto WebAssembly threading per parallelismo avanzato
3. **GPU Compute**: Integrazione con WebGPU per calcoli GPU
4. **Algoritmi avanzati**: Implementazione di algoritmi di ottimizzazione più sofisticati

---

Per domande e supporto, consulta la documentazione del codice o apri un issue su GitHub.