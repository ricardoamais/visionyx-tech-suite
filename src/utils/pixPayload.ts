 function crc16ccitt(payload: string): string {
   let crc = 0xffff
   const bytes = new TextEncoder().encode(payload)
   for (const byte of bytes) {
     crc ^= byte << 8
     for (let i = 0; i < 8; i++) {
       crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
     }
   }
   return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0')
 }
 
 function field(id: string, value: string): string {
   return `${id}${String(value.length).padStart(2, '0')}${value}`
 }
 
 export function generatePixPayload(
   pixKey: string,
   merchantName: string,
   merchantCity: string,
   amount: number,
   description: string
 ): string {
   const name = merchantName
     .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
     .replace(/[^a-zA-Z0-9 ]/g, '')
     .slice(0, 25)
     .toUpperCase()
 
   const city = merchantCity
     .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
     .replace(/[^a-zA-Z0-9 ]/g, '')
     .slice(0, 15)
     .toUpperCase()
 
   const desc = description
     .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
     .replace(/[^a-zA-Z0-9 ]/g, '')
     .slice(0, 72)
 
   const pixKeyField = field('01', pixKey)
   const descField = field('02', desc)
   const guiField = field('00', 'BR.GOV.BCB.PIX')
   const maInfo = guiField + pixKeyField + descField
 
   const payload =
     field('00', '01') +
     field('26', maInfo) +
     field('52', '0000') +
     field('53', '986') +
     field('54', amount.toFixed(2)) +
     field('58', 'BR') +
     field('59', name) +
     field('60', city) +
     field('62', field('05', '***')) +
     '6304'
 
   return payload + crc16ccitt(payload)
 }