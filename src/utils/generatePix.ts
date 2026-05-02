 export async function generatePix({
   pixKey,
   name,
   city,
   amount,
   description,
 }: {
   pixKey: string;
   name: string;
   city: string;
   amount: number;
   description: string;
 }): Promise<string> {
   const params = new URLSearchParams({
     nome: name.slice(0, 25),
     cidade: city.slice(0, 15),
     valor: amount.toFixed(2),
     saida: 'br',
     chave: pixKey,
     mensagem: description.slice(0, 72),
   });
 
   const res = await fetch(`https://gerarqrcodepix.com.br/api/v1?${params}`);
   if (!res.ok) throw new Error('Falha ao gerar QR Code Pix');
   const data = await res.json();
   return data.brcode; // EMV valid payload
 }