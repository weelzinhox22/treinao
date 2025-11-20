import type { Treino } from "@/services/treinoService";
import jsPDF from "jspdf";

// Cores do tema (em RGB)
const PRIMARY_COLOR = [59, 130, 246]; // Blue
const SECONDARY_COLOR = [30, 58, 138]; // Dark Blue
const ACCENT_COLOR = [147, 51, 234]; // Purple
const TEXT_COLOR = [15, 23, 42]; // Dark
const MUTED_COLOR = [148, 163, 184]; // Gray

// Exportar treino individual em PDF com design moderno
export const exportTreinoToPDF = (treino: Treino, userName?: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // ========== HEADER COM GRADIENTE ==========
  doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.rect(0, 0, pageWidth, 50, "F");
  
  // Logo/Ícone (simulado com texto estilizado)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("💪", 20, 30);
  doc.text("TREINÃO DOS CARAS", 35, 30);
  
  // Data no header
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    new Date(treino.date).toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    pageWidth - 20,
    30,
    { align: "right" }
  );
  
  // ========== INFORMAÇÕES DO TREINO ==========
  let yPos = 65;
  doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
  
  // Nome do treino
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(treino.name || "Treino", 20, yPos);
  yPos += 15;
  
  // Cards de estatísticas
  const stats = [
    { label: "Volume Total", value: formatVolume(treino.totalVolume), icon: "⚖️" },
    { label: "Exercícios", value: treino.exercises.length.toString(), icon: "🏋️" },
    { label: "Séries Totais", value: treino.exercises.reduce((sum, e) => sum + e.sets, 0).toString(), icon: "📊" },
  ];
  
  const cardWidth = (pageWidth - 60) / 3;
  stats.forEach((stat, index) => {
    const xPos = 20 + index * (cardWidth + 10);
    
    // Card background
    doc.setFillColor(240, 240, 240);
    doc.rect(xPos, yPos - 12, cardWidth, 20, "F");
    
    // Ícone
    doc.setFontSize(16);
    doc.text(stat.icon, xPos + 5, yPos - 2);
    
    // Valor
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(stat.value, xPos + 20, yPos - 2);
    
    // Label
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
    doc.text(stat.label, xPos + 5, yPos + 5);
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
  });
  
  yPos += 25;
  
  // ========== EXERCÍCIOS ==========
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Exercícios", 20, yPos);
  
  // Linha decorativa
  doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.setLineWidth(2);
  doc.line(20, yPos + 3, pageWidth - 20, yPos + 3);
  
  yPos += 15;
  
  doc.setFontSize(11);
  treino.exercises.forEach((exercise, index) => {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      // Header em todas as páginas
      doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
      doc.rect(0, 0, pageWidth, 30, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("TREINÃO DOS CARAS", 20, 20);
      doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
      yPos = 40;
    }
    
    // Card do exercício
    doc.setFillColor(250, 250, 250);
    doc.rect(20, yPos - 8, pageWidth - 40, 25, "F");
    
    // Número e nome
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text(`${index + 1}.`, 25, yPos + 2);
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    doc.text(exercise.name, 35, yPos + 2);
    
    // Detalhes
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
    const details = `${exercise.sets} séries × ${exercise.reps} reps @ ${exercise.weight}kg`;
    doc.text(details, 25, yPos + 10);
    
    // Volume do exercício
    const exerciseVolume = exercise.sets * exercise.reps * exercise.weight;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(ACCENT_COLOR[0], ACCENT_COLOR[1], ACCENT_COLOR[2]);
    doc.text(
      `Volume: ${formatVolume(exerciseVolume)}`,
      pageWidth - 25,
      yPos + 2,
      { align: "right" }
    );
    
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    yPos += 30;
  });
  
  // ========== RODAPÉ ==========
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Linha decorativa
    doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.setLineWidth(0.5);
    doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
    
    // Texto do rodapé
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
    doc.text(
      "TREINÃO DOS CARAS - Seu companheiro de treino",
      pageWidth / 2,
      pageHeight - 5,
      { align: "center" }
    );
    
    if (userName) {
      doc.text(
        `Treino de ${userName}`,
        pageWidth - 20,
        pageHeight - 10,
        { align: "right" }
      );
    }
  }
  
  // Salvar
  const fileName = `treino_${treino.name || "sem_nome"}_${new Date(treino.date).toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
};

// Exportar histórico completo em CSV
export const exportTreinosToCSV = (treinos: Treino[]) => {
  // Cabeçalho
  const headers = [
    "Data",
    "Nome",
    "Exercícios",
    "Volume Total (kg)",
    "Total de Exercícios",
  ];
  
  // Dados
  const rows = treinos.map((treino) => [
    new Date(treino.date).toLocaleDateString("pt-BR"),
    treino.name || "Sem nome",
    treino.exercises.map((e) => e.name).join("; "),
    treino.totalVolume.toString(),
    treino.exercises.length.toString(),
  ]);
  
  // Criar CSV
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");
  
  // Adicionar BOM para Excel
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  
  // Download
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `treinos_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Formatar volume
const formatVolume = (kg: number) => {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)}t`;
  }
  return `${Math.round(kg)}kg`;
};

