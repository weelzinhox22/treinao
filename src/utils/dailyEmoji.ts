// Sistema de Emoji do Dia - similar ao Gymrats
// Gera um emoji único baseado na data do dia

// Emojis de gestos de mão que podem ser feitos em fotos
const emojis = [
  "✊", // Punho fechado
  "👊", // Punho
  "🤛", // Punho esquerdo
  "🤜", // Punho direito
  "✌️", // Paz e vitória
  "🤞", // Dedos cruzados
  "🤘", // Chifres
  "🤙", // Telefone
  "👌", // OK
  "👍", // Polegar para cima
  "👎", // Polegar para baixo
  "✋", // Mão aberta
  "🤚", // Dorso da mão
  "👋", // Acenando
  "🤏", // Pinça
  "👐", // Mãos abertas
  "🙌", // Mãos para cima
  "👏", // Palmas
  "🤲", // Mãos juntas
  "🙏", // Oração
  "✍️", // Escrevendo
  "🤝", // Aperto de mão
  "🤟", // Eu te amo
  "🤞", // Dedos cruzados
  "🤙", // Telefone
  "👈", // Apontar esquerda
  "👉", // Apontar direita
  "👆", // Apontar cima
  "👇", // Apontar baixo
  "☝️", // Apontar cima
  "👊", // Punho
  "✊", // Punho fechado
];

export const getDailyEmoji = (date?: Date): string => {
  const targetDate = date || new Date();
  const dayOfYear = Math.floor(
    (targetDate.getTime() - new Date(targetDate.getFullYear(), 0, 0).getTime()) / 
    (1000 * 60 * 60 * 24)
  );
  
  // Usar o dia do ano como índice para garantir que o mesmo dia sempre tenha o mesmo emoji
  const index = dayOfYear % emojis.length;
  return emojis[index];
};

export const getDailyEmojiForUser = (userId: string, date?: Date): string => {
  const targetDate = date || new Date();
  const dayOfYear = Math.floor(
    (targetDate.getTime() - new Date(targetDate.getFullYear(), 0, 0).getTime()) / 
    (1000 * 60 * 60 * 24)
  );
  
  // Combinar dia do ano com hash do userId para personalização
  const userHash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = (dayOfYear + userHash) % emojis.length;
  return emojis[index];
};

