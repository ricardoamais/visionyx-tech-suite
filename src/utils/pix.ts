import { crc16ccitt } from 'crc';

export function generatePixPayload(key: string, name: string, city: string, amount: number, description: string) {
  function formatField(id: string, value: string) {
    return id + value.length.toString().padStart(2, '0') + value;
  }

  const payload: string[] = [
    '000201', // Payload Format Indicator
  ];

  // Merchant Account Information - Pix (ID 26)
  const gui = formatField('00', 'br.gov.bcb.pix');
  const keyField = formatField('01', key);
  const descField = description ? formatField('02', description) : '';
  payload.push(formatField('26', gui + keyField + descField));

  payload.push('52040000'); // Merchant Category Code
  payload.push('5303986'); // Transaction Currency - BRL

  // Transaction Amount (ID 54)
  if (amount > 0) {
    const amountStr = amount.toFixed(2);
    payload.push(formatField('54', amountStr));
  }

  payload.push('5802BR'); // Country Code

  // Merchant Name (ID 59)
  const formattedName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 25);
  payload.push(formatField('59', formattedName));

  // Merchant City (ID 60)
  const formattedCity = city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 15);
  payload.push(formatField('60', formattedCity));

  // Additional Data Field Template (ID 62)
  const txid = formatField('05', '***');
  payload.push(formatField('62', txid));

  // CRC16 (ID 63)
  const prePayload = payload.join('') + '6304';
  const crc = crc16ccitt(prePayload).toString(16).toUpperCase().padStart(4, '0');
  
  return prePayload + crc;
}
