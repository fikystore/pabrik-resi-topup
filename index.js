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
