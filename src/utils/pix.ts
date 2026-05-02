 function formatField(id: string, value: string): string {
   const size = value.length.toString().padStart(2, '0');
   return `${id}${size}${value}`;
 }
 
 function crc16(str: string): string {
   let crc = 0xffff;
   for (let i = 0; i < str.length; i++) {
     crc ^= str.charCodeAt(i) << 8;
     for (let j = 0; j < 8; j++) {
       crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
     }
   }
   return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
 }
 
 export function generatePixPayload({
   pixKey,
   merchantName,
   merchantCity,
   amount,
   description,
 }: {
   pixKey: string;
   merchantName: string;
   merchantCity: string;
   amount: number;
   description: string;
 }): string {
   const gui = formatField('00', 'BR.GOV.BCB.PIX');
   const key = formatField('01', pixKey.slice(0, 77));
   const desc = formatField('02', description.slice(0, 72));
   const innerContent = gui + key + desc;
   const merchantAccountInfo = '26' + innerContent.length.toString().padStart(2, '0') + innerContent;
 
   const amountStr = amount.toFixed(2);
 
   const payload =
     formatField('00', '01') +
     merchantAccountInfo +
     formatField('52', '0000') +
     formatField('53', '986') +
     formatField('54', amountStr) +
     formatField('58', 'BR') +
     formatField('59', merchantName.slice(0, 25).normalize('NFD').replace(/[\u0300-\u036f]/g, '')) +
     formatField('60', merchantCity.slice(0, 15).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()) +
     formatField('62', formatField('05', '***')) +
     '6304';
 
   return payload + crc16(payload);
 }
