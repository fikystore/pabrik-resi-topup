const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

let browserInstance = null;

// Fungsi sakti biar browser tetep standby & hemat RAM
async function getBrowser() {
    if (!browserInstance || !browserInstance.process()) {
        browserInstance = await puppeteer.launch({
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process'
            ],
            headless: "new"
        });
    }
    return browserInstance;
}

// 👇 INI DIA PINTU KHUSUS BUAT CRON-JOB BOS 👇
app.get('/', (req, res) => {
    res.status(200).send('RESI SIAP BOSSS');
});
// 👆 ========================================== 👆

// ==========================================
// 📷 GENERATOR QRIS OTOMATIS (DIJEPRET PUPPETEER JADI PNG)
// ==========================================
app.get('/generate-qris', async (req, res) => {
    let page;
    try {
        const nominal = req.query.nominal || 1000;
        const browser = await getBrowser();
        page = await browser.newPage();

        // Desain HTML QRIS Bos Fiky yang sudah Final
        const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>QRIS Payment - Pusat Topup</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Poppins', sans-serif;
    background: white;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  }

  .card {
    width: 1080px;
    height: 1080px;
    background: white;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* Sudut biru kiri atas */
  .corner-tl { position: absolute; top: 0; left: 0; width: 220px; height: 220px; z-index: 1; }
  .corner-tl::before { content: ''; position: absolute; top: 0; left: 0; width: 0; height: 0; border-style: solid; border-width: 220px 220px 0 0; border-color: #1565C0 transparent transparent transparent; }
  .stripe-tl-1 { position: absolute; top: 30px; left: -10px; width: 180px; height: 18px; background: #42A5F5; transform: rotate(-45deg); transform-origin: left center; z-index: 2; }
  .stripe-tl-2 { position: absolute; top: 60px; left: -10px; width: 140px; height: 14px; background: #64B5F6; transform: rotate(-45deg); transform-origin: left center; z-index: 2; }

  /* Sudut biru kanan bawah */
  .corner-br { position: absolute; bottom: 0; right: 0; width: 220px; height: 220px; z-index: 1; }
  .corner-br::before { content: ''; position: absolute; bottom: 0; right: 0; width: 0; height: 0; border-style: solid; border-width: 0 0 220px 220px; border-color: transparent transparent #1565C0 transparent; }
  .stripe-br-1 { position: absolute; bottom: 30px; right: -10px; width: 180px; height: 18px; background: #42A5F5; transform: rotate(-45deg); transform-origin: right center; z-index: 2; }
  .stripe-br-2 { position: absolute; bottom: 60px; right: -10px; width: 140px; height: 14px; background: #64B5F6; transform: rotate(-45deg); transform-origin: right center; z-index: 2; }

  /* KONTEN UTAMA */
  .content { position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; flex-grow: 1; }

  /* Logo PT */
  .logo-wrap { display: flex; flex-direction: column; align-items: center; margin-bottom: 18px; }
  .logo-circle { width: 90px; height: 90px; background: linear-gradient(135deg, #1565C0, #42A5F5); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(21,101,192,0.3); margin-bottom: 6px; position: relative; }
  .logo-pt { font-size: 34px; font-weight: 800; color: white; letter-spacing: -1px; }
  .logo-tagline { font-size: 13px; color: #1565C0; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; }

  /* Teks header */
  .header-text { text-align: center; margin-bottom: 8px; }
  .header-text .sub { font-size: 22px; color: #333; font-weight: 400; }
  .header-text .main { font-size: 42px; font-weight: 800; color: #111; line-height: 1.1; }
  .header-sub { font-size: 16px; color: #555; margin-bottom: 20px; font-weight: 400; }

  /* QR CODE AREA */
  .qr-wrapper { position: relative; width: 480px; height: 480px; display: flex; align-items: center; justify-content: center; }
  .qr-frame { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
  .qr-frame::before, .qr-frame::after, .qr-inner::before, .qr-inner::after { content: ''; position: absolute; width: 50px; height: 50px; border-color: #1a1a1a; border-style: solid; }
  .qr-frame::before { top: 0; left: 0; border-width: 5px 0 0 5px; }
  .qr-frame::after  { top: 0; right: 0; border-width: 5px 5px 0 0; }
  .qr-inner::before { bottom: 0; left: 0; border-width: 0 0 5px 5px; }
  .qr-inner::after  { bottom: 0; right: 0; border-width: 0 5px 5px 0; }
  .qr-inner { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
  #qr-canvas { width: 440px; height: 440px; image-rendering: pixelated; }

  /* Telegram footer */
  .tg-footer { display: flex; align-items: center; gap: 10px; margin-top: 24px; margin-bottom: 30px; }
  .tg-icon { width: 38px; height: 38px; background: #229ED9; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .tg-icon svg { width: 22px; height: 22px; fill: white; }
  .tg-handle { font-size: 22px; font-weight: 600; color: #222; }
</style>
</head>
<body>

<div class="card" id="card">
  <div class="corner-tl"></div><div class="stripe-tl-1"></div><div class="stripe-tl-2"></div>
  <div class="corner-br"></div><div class="stripe-br-1"></div><div class="stripe-br-2"></div>

  <div class="content">
    <div class="logo-wrap">
      <img src="https://i.postimg.cc/R0RzfKDC/IMG-20260521-191455.jpg" style="width:250px; height:250px; object-fit:contain; border-radius: 50%;" />
    </div>

    <div class="header-text">
      <div class="sub">Untuk Melakukan Pembayaran</div>
      <div class="main">Scan Disini!</div>
    </div>
    <div class="header-sub">Pusat Topup X Fiky Store</div>

    <div class="qr-wrapper">
      <div class="qr-frame"><div class="qr-inner"></div></div>
      <canvas id="qr-canvas" width="440" height="440"></canvas>
    </div>

    <div id="nominal-display" style="font-size: 42px; font-weight: 800; color: #1565C0; margin-top: 25px; letter-spacing: 1px;">
      Rp 0
    </div>

    <div class="tg-footer">
      <div class="tg-icon">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
      </div>
      <span class="tg-handle">@PusatTopup_bot</span>
    </div>
  </div>
</div>

<script>
function crc16(data) {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function generateQrisString(nominal) {
  const qrisBase = '00020101021226570011ID.DANA.WWW011893600915335451262702093545126270303UMI51440014ID.CO.QRIS.WWW0215ID10222268794610303UMI52045732530336055802ID5910Fiky Store6012Kab. Sumenep6105694626304';
  const nomStr = String(Math.round(nominal));
  const field54 = '54' + String(nomStr.length).padStart(2, '0') + nomStr;
  const qrisBaru = qrisBase.replace('5802ID', field54 + '5802ID');
  return qrisBaru + crc16(qrisBaru);
}

function loadQR(nominal) {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
  script.onload = function() {
    const qrisStr = generateQrisString(nominal);
    const wrapper = document.getElementById('qr-canvas').parentNode;
    const oldCanvas = document.getElementById('qr-canvas');
    const div = document.createElement('div');
    div.id = 'qr-div';
    div.style.width = '440px';
    div.style.height = '440px';
    wrapper.replaceChild(div, oldCanvas);

    new QRCode(div, { text: qrisStr, width: 440, height: 440, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });

    setTimeout(() => {
      const img = div.querySelector('img');
      if (img) { img.style.width = '440px'; img.style.height = '440px'; }
    }, 200);
  };
  document.head.appendChild(script);
}

const nominalData = ${nominal};
document.getElementById('nominal-display').innerText = 'Rp ' + parseInt(nominalData).toLocaleString('id-ID');
loadQR(nominalData);
</script>
</body>
</html>
        `;

        // Settingan resolusi kamera Puppeteer agar jepretan kotak sempurna (1080x1080)
        await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        // Jeda 1 detik agar QRCodeJs selesai menggambar barcode
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Jepret layar menjadi PNG
        const imageBuffer = await page.screenshot({ 
            type: 'png', 
            clip: { x: 0, y: 0, width: 1080, height: 1080 } 
        });

        res.set('Content-Type', 'image/png');
        res.send(imageBuffer);

    } catch (e) {
        console.error(e);
        res.status(500).send("Gagal cetak QRIS: " + e.message);
    } finally {
        if (page) await page.close(); // Wajib ditutup agar memori server tidak penuh
    }
});
// 👆 ========================================== 👆

// ==========================================
// KODE RESI ASLI (TIDAK DISENTUH SAMA SEKALI)
// ==========================================
app.get('/generate-resi', async (req, res) => {
    let page;
    try {
        const { brand, tgl, id, produk, nohp, harga, sn } = req.query;
        const browser = await getBrowser();
        
        // Membuka tab baru (jauh lebih enteng daripada buka browser baru)
        page = await browser.newPage();

        // 👇 MERAPIKAN NAMA PRODUK MASA AKTIF 👇
        let namaProduk = produk || '-';
        if (namaProduk.toUpperCase().includes('MASA AKTIF')) {
            // Memotong kata yang kepanjangan dari Digiflazz
            namaProduk = namaProduk.replace(/Tambah Masa Aktif Kartu/gi, 'Masa Aktif');
            namaProduk = namaProduk.replace(/Tambah Masa Aktif/gi, 'Masa Aktif');
        }
        // 👆 ================================== 👆

        let htmlContent = "";
        const isPLN = namaProduk.toUpperCase().includes('PLN');

        if (isPLN) {
            // ==========================================
            // ⚡ DESAIN KHUSUS PLN (MIRIP GAMBAR BOS) ⚡
            // ==========================================
            let finalSN = sn || '-';
            let namaAsli = "-", golongan = "-", daya = "-", kwh = "-";
            
            // Membedah SN dari Digiflazz
            if (sn && sn.includes('/')) {
                const snParts = sn.split('/');
                
                // Ambil Token
                let tokenRaw = snParts[0].replace(/[^0-9]/g, ''); 
                if (tokenRaw.length === 20) {
                    finalSN = tokenRaw.match(/.{1,4}/g).join('-'); 
                } else {
                    finalSN = snParts[0].trim();
                }

                if (snParts.length > 1) namaAsli = snParts[1].trim();
                if (snParts.length > 2) golongan = snParts[2].trim();
                if (snParts.length > 3) daya = snParts[3].trim() + (snParts[3].toLowerCase().includes('va') ? '' : ' VA');
                if (snParts.length > 4) kwh = snParts[4].trim() + (snParts[4].toLowerCase().includes('kwh') ? '' : ' kWh');
            }

            // Memisahkan Tanggal dan Jam agar bisa dibikin 2 baris rapi
            let tglPart = tgl ? tgl.split(' ')[0] : '-';
            let jamPart = tgl && tgl.includes(' ') ? tgl.split(' ')[1] : '';

            htmlContent = `
            <html>
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet">
                <style>
                    body { 
                        width: 380px; padding: 30px; background: white; 
                        font-family: 'Courier Prime', monospace; color: #000; margin: 0;
                    }
                    .header-left { font-size: 20px; margin-bottom: 5px; }
                    .date-top { font-size: 16px; margin-bottom: 35px; }
                    .title { text-align: center; font-size: 24px; margin-bottom: 35px; line-height: 1.3; }
                    
                    .row { display: flex; font-size: 18px; margin-bottom: 12px; line-height: 1.4; align-items: flex-start;}
                    .col-label { width: 145px; flex-shrink: 0; }
                    .col-colon { width: 25px; text-align: center; flex-shrink: 0; }
                    .col-val { flex-grow: 1; word-wrap: break-word; }
                    
                    .token-title { text-align: center; font-size: 18px; margin-top: 40px; margin-bottom: 8px;}
                    .token-number { text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 1px; margin-bottom: 35px; }
                    
                    .footer { text-align: center; font-size: 18px; line-height: 1.6; }
                </style>
            </head>
            <body>
                <div class="header-left">${brand || '@PusatTopup_bot'}</div>
                <div class="date-top">${tgl || '-'}</div>
                
                <div class="title">STRUK PEMBAYARAN<br>TOKEN PLN</div>
                
                <div class="row"><div class="col-label">TANGGAL</div><div class="col-colon">:</div><div class="col-val">${tglPart}<br>${jamPart}</div></div>
                <div class="row"><div class="col-label">ID TRANSAK...</div><div class="col-colon">:</div><div class="col-val">${id || '-'}</div></div>
                <div class="row"><div class="col-label">PRODUK</div><div class="col-colon">:</div><div class="col-val">${namaProduk}</div></div>
                <div class="row"><div class="col-label">ID PELANGG...</div><div class="col-colon">:</div><div class="col-val">${nohp || '-'}</div></div>
                <div class="row"><div class="col-label">STATUS</div><div class="col-colon">:</div><div class="col-val">SUKSES</div></div>
                <div class="row"><div class="col-label">NAMA</div><div class="col-colon">:</div><div class="col-val">${namaAsli}</div></div>
                <div class="row"><div class="col-label">GOLONGAN</div><div class="col-colon">:</div><div class="col-val">${golongan}</div></div>
                <div class="row"><div class="col-label">DAYA METER</div><div class="col-colon">:</div><div class="col-val">${daya}</div></div>
                <div class="row"><div class="col-label">DAYA TOKEN</div><div class="col-colon">:</div><div class="col-val">${kwh}</div></div>
                <div class="row"><div class="col-label">HARGA</div><div class="col-colon">:</div><div class="col-val">Rp ${harga || '-'}</div></div>
                
                <div class="token-title">Kode Token</div>
                <div class="token-number">${finalSN}</div>
                
                <div class="footer">
                    === Terima Kasih ===<br>Terimakasih
                </div>
            </body>
            </html>`;

        } else {
            // ==========================================
            // 📱 DESAIN NORMAL (PULSA/DATA) ANTI-NABRAK
            // ==========================================
            let finalSN = sn || '-';

            htmlContent = `
            <html>
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet">
                <style>
                    body { 
                        width: 350px; padding: 20px; background: white; 
                        font-family: 'Courier Prime', monospace; color: #000; margin: 0;
                    }
                    .center { text-align: center; }
                    .bold { font-weight: bold; font-size: 24px; }
                    .line { border-top: 2px dashed #000; margin: 15px 0; }
                    
                    /* 👇 CSS ANTI NABRAK 👇 */
                    .item { 
                        display: flex; justify-content: space-between; 
                        margin-bottom: 8px; font-size: 16px; align-items: flex-start; 
                    }
                    .label { min-width: 115px; } 
                    .value { 
                        text-align: right; 
                        word-wrap: break-word; 
                        max-width: 210px; 
                    }
                    /* 👆 ================= 👆 */
                    
                    .sn-box { 
                        background: #f0f0f0; padding: 15px; margin-top: 10px; 
                        text-align: center; border: 1px solid #000; 
                        font-size: 19px; font-weight: bold; letter-spacing: 1px;
                        word-wrap: break-word;
                    }
                    .footer { font-size: 13px; margin-top: 15px; font-style: italic; }
                </style>
            </head>
            <body>
                <div class="center bold">${brand || '@PusatTopup_bot'}</div>
                <div class="center" style="font-size: 14px; margin-top: 5px;">${tgl || '-'}</div>
                <div class="line"></div>
                <div class="center bold" style="font-size: 20px; margin-bottom: 20px;">STRUK PEMBELIAN</div>
                
                <div class="item"><span class="label">ID Transaksi</span> <span class="value">${id || '-'}</span></div>
                <div class="item"><span class="label">Produk</span> <span class="value">${namaProduk}</span></div>
                <div class="item"><span class="label">No Tujuan</span> <span class="value">${nohp || '-'}</span></div>
                <div class="item"><span class="label">Harga</span> <span class="value bold">Rp ${harga || '-'}</span></div>
                
                <div class="line"></div>
                <div class="center" style="font-size: 14px;">SERIAL NUMBER (SN)</div>
                <div class="sn-box">${finalSN}</div>
                
                <div class="line"></div>
                <div class="center bold" style="font-size: 16px;">TERIMA KASIH</div>
                <div class="center footer">Simpan resi ini sebagai bukti pembayaran yang sah.</div>
            </body>
            </html>`;
        }

        // Settingan agar gambar tajam dan pas di HP
        await page.setViewport({ width: 390, height: 100, deviceScaleFactor: 2 });
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        // Render gambar PNG
        const imageBuffer = await page.screenshot({ 
            type: 'png', 
            fullPage: true,
            omitBackground: false 
        });

        res.set('Content-Type', 'image/png');
        res.send(imageBuffer);

    } catch (e) {
        console.error(e);
        res.status(500).send("Gagal cetak resi: " + e.message);
    } finally {
        if (page) await page.close(); // Tutup tab (wajib biar RAM gak bengkak)
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Pabrik Resi sudah nyala di port ${PORT}`);
});
