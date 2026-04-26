const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

let browserInstance = null;

// Fungsi sakti biar browser tetep standby & hemat RAM
async function getBrowser() {
    if (!browserInstance || !browserInstance.isConnected()) {
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

app.get('/generate-resi', async (req, res) => {
    let page;
    try {
        const { brand, tgl, id, produk, nohp, harga, sn } = req.query;
        const browser = await getBrowser();
        
        // Membuka tab baru (jauh lebih enteng daripada buka browser baru)
        page = await browser.newPage();

        // 👇 LOGIKA PINTAR KHUSUS PLN (Baru Ditambahkan) 👇
        let htmlNama = "";
        let labelTujuan = "No Tujuan";
        let labelSN = "SERIAL NUMBER (SN)";
        let finalSN = sn || '-';

        // Deteksi otomatis kalau produknya ada tulisan "PLN"
        if (produk && produk.toUpperCase().includes('PLN')) {
            labelTujuan = "ID Pelanggan";
            labelSN = "SERIAL NUMBER (SN/TOKEN)";
            
            // Memecah SN Digiflazz untuk ambil Token dan Nama
            if (sn && sn.includes('/')) {
                const snParts = sn.split('/');
                
                // 1. Ambil 20 digit token, kasih strip (-) biar rapi
                let tokenRaw = snParts[0].replace(/[^0-9]/g, ''); 
                if (tokenRaw.length === 20) {
                    finalSN = tokenRaw.match(/.{1,4}/g).join('-'); 
                } else {
                    finalSN = snParts[0].trim();
                }

                // 2. Ambil Nama Pelanggan (Bagian setelah garis miring pertama)
                if (snParts.length > 1) {
                    let namaAsli = snParts[1].trim();
                    htmlNama = `<div class="item"><span>Nama</span> <span>${namaAsli}</span></div>`;
                }
            }
        }
        // 👆 ========================================= 👆

        // Desain HTML Struk Thermal HD
        const htmlContent = `
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
                .item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 16px; }
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
            
            ${htmlNama}
            <div class="item"><span>ID Transaksi</span> <span>${id || '-'}</span></div>
            <div class="item"><span>Produk</span> <span>${produk || '-'}</span></div>
            <div class="item"><span>${labelTujuan}</span> <span>${nohp || '-'}</span></div>
            <div class="item"><span>Harga</span> <span class="bold">Rp ${harga || '-'}</span></div>
            
            <div class="line"></div>
            <div class="center" style="font-size: 14px;">${labelSN}</div>
            <div class="sn-box">${finalSN}</div>
            
            <div class="line"></div>
            <div class="center bold" style="font-size: 16px;">TERIMA KASIH</div>
            <div class="center footer">Simpan resi ini sebagai bukti pembayaran yang sah.</div>
        </body>
        </html>`;

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
