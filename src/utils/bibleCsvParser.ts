import { BIBLE_BOOKS } from '../components/BibliaView';

export interface ParsedBibleBook {
  name: string;
  abbrev: string;
  chapters: string[][];
}

// Mapa para normalização de nomes, abreviações (português, inglês USFM/OSIS) e números dos 66 livros da Bíblia
const BOOK_NORM_MAP: Record<string, number> = {
  // Gênesis (0)
  'gn': 0, 'gen': 0, 'genesis': 0, 'genes': 0, '1': 0,
  // Êxodo (1)
  'ex': 1, 'exo': 1, 'exodo': 1, '2': 1,
  // Levítico (2)
  'lv': 2, 'lev': 2, 'levitico': 2, '3': 2,
  // Números (3)
  'nm': 3, 'num': 3, 'numeros': 3, '4': 3,
  // Deuteronômio (4)
  'dt': 4, 'deu': 4, 'deut': 4, 'deuteronomio': 4, '5': 4,
  // Josué (5)
  'js': 5, 'jos': 5, 'josue': 5, '6': 5,
  // Juízes (6)
  'jz': 6, 'jui': 6, 'juizes': 6, 'jdg': 6, 'judges': 6, '7': 6,
  // Rute (7)
  'rt': 7, 'rut': 7, 'rute': 7, 'ruth': 7, '8': 7,
  // 1 Samuel (8)
  '1sm': 8, '1sam': 8, '1samuel': 8, 'isamuel': 8, '1s': 8, '1sa': 8, '9': 8,
  // 2 Samuel (9)
  '2sm': 9, '2sam': 9, '2samuel': 9, 'iisamuel': 9, '2s': 9, '2sa': 9, '10': 9,
  // 1 Reis (10)
  '1rs': 10, '1re': 10, '1reis': 10, 'ireis': 10, '1r': 10, '1ki': 10, '1kings': 10, '11': 10,
  // 2 Reis (11)
  '2rs': 11, '2re': 11, '2reis': 11, 'iireis': 11, '2r': 11, '2ki': 11, '2kings': 11, '12': 11,
  // 1 Crônicas (12)
  '1cr': 12, '1cro': 12, '1cronicas': 12, 'icronicas': 12, '1c': 12, '1ch': 12, '1chronicles': 12, '13': 12,
  // 2 Crônicas (13)
  '2cr': 13, '2cro': 13, '2cronicas': 13, 'iicronicas': 13, '2c': 13, '2ch': 13, '2chronicles': 13, '14': 13,
  // Esdras (14)
  'ed': 14, 'esd': 14, 'esdras': 14, 'ezr': 14, 'ezra': 14, '15': 14,
  // Neemias (15)
  'ne': 15, 'nee': 15, 'neemias': 15, 'neh': 15, 'nehemiah': 15, '16': 15,
  // Ester (16)
  'et': 16, 'est': 16, 'ester': 16, 'esther': 16, '17': 16,
  // Jó (17)
  'jo': 17, 'job': 17, '18': 17,
  // Salmos (18)
  'sl': 18, 'sal': 18, 'salmo': 18, 'salmos': 18, 'ps': 18, 'psa': 18, 'psalm': 18, 'psalms': 18, '19': 18,
  // Provérbios (19)
  'pv': 19, 'pro': 19, 'prov': 19, 'proverbios': 19, 'proverbs': 19, '20': 19,
  // Eclesiastes (20)
  'ec': 20, 'ecl': 20, 'eclesiastes': 20, 'ecc': 20, 'ecclesiastes': 20, '21': 20,
  // Cantares / Cânticos (21)
  'ct': 21, 'can': 21, 'cantares': 21, 'cantico': 21, 'canticos': 21, 'sng': 21, 'song': 21, 'songs': 21, '22': 21,
  // Isaías (22)
  'is': 22, 'isa': 22, 'isaias': 22, 'isaiah': 22, '23': 22,
  // Jeremias (23)
  'jr': 23, 'jer': 23, 'jeremias': 23, 'jeremiah': 23, '24': 23,
  // Lamentações (24)
  'lm': 24, 'lam': 24, 'lamentacoes': 24, 'lamentations': 24, '25': 24,
  // Ezequiel (25)
  'ez': 25, 'eze': 25, 'ezequiel': 25, 'ezk': 25, 'ezekiel': 25, '26': 25,
  // Daniel (26)
  'dn': 26, 'dan': 26, 'daniel': 26, '27': 26,
  // Oséias (27)
  'os': 27, 'ose': 27, 'oseias': 27, 'hos': 27, 'hosea': 27, '28': 27,
  // Joel (28)
  'jl': 28, 'joe': 28, 'joel': 28, 'jol': 28, '29': 28,
  // Amós (29)
  'am': 29, 'amo': 29, 'amos': 29, '30': 29,
  // Obadias (30)
  'ob': 30, 'oba': 30, 'obadias': 30, 'obadiah': 30, '31': 30,
  // Jonas (31)
  'jn': 31, 'jon': 31, 'jonas': 31, 'jonah': 31, '32': 31,
  // Miquéias (32)
  'mq': 32, 'miq': 32, 'miqueias': 32, 'mic': 32, 'micah': 32, '33': 32,
  // Naum (33)
  'na': 33, 'nau': 33, 'naum': 33, 'nam': 33, 'nahum': 33, '34': 33,
  // Habacuque (34)
  'hc': 34, 'hab': 34, 'habacuque': 34, 'habakkuk': 34, '35': 34,
  // Sofonias (35)
  'sf': 35, 'sof': 35, 'sofonias': 35, 'zep': 35, 'zephaniah': 35, '36': 35,
  // Ageu (36)
  'ag': 36, 'age': 36, 'ageu': 36, 'hag': 36, 'haggai': 36, '37': 36,
  // Zacarias (37)
  'zc': 37, 'zac': 37, 'zacarias': 37, 'zec': 37, 'zechariah': 37, '38': 37,
  // Malaquias (38)
  'ml': 38, 'mal': 38, 'malaquias': 38, 'malachi': 38, '39': 38,
  // Mateus (39)
  'mt': 39, 'mat': 39, 'mateus': 39, 'matthew': 39, '40': 39,
  // Marcos (40)
  'mc': 40, 'mar': 40, 'marcos': 40, 'mrk': 40, 'mark': 40, '41': 40,
  // Lucas (41)
  'lc': 41, 'luc': 41, 'lucas': 41, 'luk': 41, 'luke': 41, '42': 41,
  // João (42)
  'joh': 42, 'jhn': 42, 'joao': 42, 'sjoao': 42, 'john': 42, '43': 42,
  // Atos (43)
  'at': 43, 'ato': 43, 'atos': 43, 'act': 43, 'acts': 43, '44': 43,
  // Romanos (44)
  'rm': 44, 'rom': 44, 'romanos': 44, 'romans': 44, '45': 44,
  // 1 Coríntios (45)
  '1co': 45, '1cor': 45, '1corintios': 45, 'icorintios': 45, '1corinthians': 45, '46': 45,
  // 2 Coríntios (46)
  '2co': 46, '2cor': 46, '2corintios': 46, 'iicorintios': 46, '2corinthians': 46, '47': 46,
  // Gálatas (47)
  'gl': 47, 'gal': 47, 'galatas': 47, 'galatians': 47, '48': 47,
  // Efésios (48)
  'ef': 48, 'efe': 48, 'efesios': 48, 'eph': 48, 'ephesians': 48, '49': 48,
  // Filipenses (49)
  'fp': 49, 'fil': 49, 'filipenses': 49, 'php': 49, 'philippians': 49, '50': 49,
  // Colossenses (50)
  'cl': 50, 'col': 50, 'colossenses': 50, 'colossians': 50, '51': 50,
  // 1 Tessalonicenses (51)
  '1ts': 51, '1tes': 51, '1tess': 51, '1tessalonicenses': 51, 'itessalonicenses': 51, '1th': 51, '1thessalonians': 51, '52': 51,
  // 2 Tessalonicenses (52)
  '2ts': 52, '2tes': 52, '2tess': 52, '2tessalonicenses': 52, 'iitessalonicenses': 52, '2th': 52, '2thessalonians': 52, '53': 52,
  // 1 Timóteo (53)
  '1tm': 53, '1tim': 53, '1timoteo': 53, 'itimoteo': 53, '1ti': 53, '1timothy': 53, '54': 53,
  // 2 Timóteo (54)
  '2tm': 54, '2tim': 54, '2timoteo': 54, 'iitimoteo': 54, '2ti': 54, '2timothy': 54, '55': 54,
  // Tito (55)
  'tt': 55, 'tit': 55, 'tito': 55, 'titus': 55, '56': 55,
  // Filemom (56)
  'fm': 56, 'flm': 56, 'filemom': 56, 'phm': 56, 'philemon': 56, '57': 56,
  // Hebreus (57)
  'hb': 57, 'heb': 57, 'hebreus': 57, 'hebrews': 57, '58': 57,
  // Tiago (58)
  'tg': 58, 'tia': 58, 'tiago': 58, 'jas': 58, 'james': 58, '59': 58,
  // 1 Pedro (59)
  '1pe': 59, '1ped': 59, '1pedro': 59, 'ipedro': 59, '1peter': 59, '60': 59,
  // 2 Pedro (60)
  '2pe': 60, '2ped': 60, '2pedro': 60, 'iipedro': 60, '2peter': 60, '61': 60,
  // 1 João (61)
  '1jo': 61, '1joao': 61, 'ijoao': 61, '1jn': 61, '1john': 61, '62': 61,
  // 2 João (62)
  '2jo': 62, '2joao': 62, 'iijoao': 62, '2jn': 62, '2john': 62, '63': 62,
  // 3 João (63)
  '3jo': 63, '3joao': 63, 'iiijoao': 63, '3jn': 63, '3john': 63, '64': 63,
  // Judas (64)
  'jd': 64, 'jud': 64, 'judas': 64, 'jude': 64, '65': 64,
  // Apocalipse (65)
  'ap': 65, 'apoc': 65, 'apocalipse': 65, 'rev': 65, 'revelation': 65, '66': 65
};

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Identifica o separador do CSV (; ou , ou \t ou |) com consistência estrutural
 */
function detectDelimiter(sample: string): string {
  const lines = sample.split(/\r\n|\r|\n/).slice(0, 20).filter(l => l.trim().length > 0);
  if (lines.length === 0) return ';';

  const delimiters = [';', '\t', ',', '|'];
  let bestDelim = ';';
  let bestScore = -1;

  for (const d of delimiters) {
    const colCounts = lines.map(l => l.split(d).length);
    const minCols = Math.min(...colCounts);
    const maxCols = Math.max(...colCounts);

    // Se o delimitador cria pelo menos 2 colunas
    if (minCols >= 2) {
      // Bônus alto para contagem consistente de colunas em todas as linhas
      const consistency = maxCols === minCols ? 100 : (minCols / maxCols) * 50;
      const score = consistency + minCols;
      if (score > bestScore) {
        bestScore = score;
        bestDelim = d;
      }
    }
  }

  return bestDelim;
}

/**
 * Parser robusto de linha CSV respeitando aspas duplas escapadas ("" ou \")
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parser Universal Inteligente de CSV de Bíblia
 * Suporta formatos:
 * - [id, livro, capitulo, versiculo, texto] (5 colunas)
 * - [livro, capitulo, versiculo, texto] (4 colunas)
 * - [referencia, texto] (ex: "Gênesis 1:1", "No princípio...")
 * - CSV com linhas agrupadas onde livro/capítulo não se repetem
 * - Cabeçalhos variados em Português ou Inglês
 */
export function parseBibleCSV(csvText: string): ParsedBibleBook[] {
  if (!csvText || !csvText.trim()) {
    throw new Error('Arquivo CSV vazio');
  }

  // Prepara estrutura com os 66 livros da Bíblia
  const books: ParsedBibleBook[] = BIBLE_BOOKS.map((b) => ({
    name: b.name,
    abbrev: b.abbr.toLowerCase(),
    chapters: Array.from({ length: b.chapters }, () => [])
  }));

  const delimiter = detectDelimiter(csvText);
  // Divide linhas suportando \r\n, \r ou \n
  const rawLines = csvText.split(/\r\n|\r|\n/).filter(l => l.trim().length > 0);
  
  if (rawLines.length === 0) {
    throw new Error('Nenhuma linha encontrada no CSV');
  }

  // Analisa as primeiras 30 linhas para mapeamento inteligente de colunas
  const sampleRows: string[][] = [];
  for (let i = 0; i < Math.min(rawLines.length, 30); i++) {
    sampleRows.push(parseCSVLine(rawLines[i], delimiter));
  }

  const numCols = sampleRows[0]?.length || 0;
  if (numCols < 2) {
    throw new Error('O arquivo CSV deve conter pelo menos 2 colunas separadas por delimitador.');
  }

  // 1. Testa se a primeira linha é cabeçalho
  const firstRowNorm = sampleRows[0].map(c => normalizeString(c));
  const isHeader = firstRowNorm.some(col => 
    ['livro', 'book', 'nome', 'liv', 'b', 'capitulo', 'chapter', 'cap', 'c', 'versiculo', 'verse', 'ver', 'v', 'verso', 'texto', 'text', 'txt', 't'].includes(col)
  );

  let bookCol = -1;
  let chapCol = -1;
  let verseCol = -1;
  let textCol = -1;
  let startIndex = 0;

  if (isHeader) {
    startIndex = 1;
    firstRowNorm.forEach((col, idx) => {
      if (['livro', 'book', 'nome', 'liv', 'idlivro', 'bookid', 'cdlivro', 'codlivro', 'numlivro', 'livroid', 'b'].includes(col)) {
        if (bookCol === -1) bookCol = idx;
      } else if (['capitulo', 'chapter', 'cap', 'ch', 'cp', 'c', 'nrcapitulo', 'numcapitulo', 'capituloid'].includes(col)) {
        if (chapCol === -1) chapCol = idx;
      } else if (['versiculo', 'verse', 'ver', 'v', 'vrs', 'verso', 'versos', 'nrversiculo', 'numversiculo', 'versiculoid'].includes(col)) {
        if (verseCol === -1) verseCol = idx;
      } else if (['texto', 'text', 'txt', 'dstexto', 'conteudo', 'mensagem', 'msg', 'palavra', 'escritura', 't'].includes(col)) {
        if (textCol === -1) textCol = idx;
      }
    });
  }

  const dataRows = isHeader ? sampleRows.slice(1) : sampleRows;

  // Localiza a coluna de texto (a coluna com maior comprimento médio de caracteres)
  if (textCol === -1) {
    let maxAvgLen = 0;
    for (let c = 0; c < numCols; c++) {
      const avgLen = dataRows.reduce((sum, r) => sum + (r[c] ? r[c].length : 0), 0) / (dataRows.length || 1);
      if (avgLen > maxAvgLen) {
        maxAvgLen = avgLen;
        textCol = c;
      }
    }
  }

  // Identificação inteligente das colunas de dados numéricas ou textuais restantes
  if (verseCol === -1 || chapCol === -1 || bookCol === -1) {
    // Procura a coluna de versículos (aquela que incrementa sequencialmente 1, 2, 3...)
    if (verseCol === -1) {
      let bestIncCol = -1;
      let maxIncrements = -1;
      for (let c = 0; c < numCols; c++) {
        if (c === textCol || c === bookCol || c === chapCol) continue;
        let incCount = 0;
        for (let r = 1; r < dataRows.length; r++) {
          const prev = parseInt(dataRows[r - 1][c], 10);
          const curr = parseInt(dataRows[r][c], 10);
          if (!isNaN(prev) && !isNaN(curr) && curr === prev + 1) {
            incCount++;
          }
        }
        if (incCount > maxIncrements && incCount >= 1) {
          maxIncrements = incCount;
          bestIncCol = c;
        }
      }
      if (bestIncCol !== -1) {
        verseCol = bestIncCol;
      }
    }

    // Se ainda não identificou, usa posição padrão antes do texto
    if (textCol >= 3) {
      if (verseCol === -1) verseCol = textCol - 1;
      if (chapCol === -1) chapCol = textCol - 2;
      if (bookCol === -1) bookCol = textCol - 3;
    } else if (textCol === 2) {
      if (verseCol === -1) verseCol = 1;
      if (chapCol === -1) chapCol = 0;
    } else if (textCol === 1) {
      bookCol = 0;
    }
  }

  let loadedVersesCount = 0;
  let lastBookIndex = 0;
  let lastChapNum = 1;
  let lastVerseNum = 0;

  for (let i = startIndex; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

    const cols = parseCSVLine(line, delimiter);
    if (cols.length < 2) continue;

    let rawBook = bookCol >= 0 && bookCol < cols.length ? cols[bookCol] : '';
    let rawChap = chapCol >= 0 && chapCol < cols.length ? cols[chapCol] : '';
    let rawVerse = verseCol >= 0 && verseCol < cols.length ? cols[verseCol] : '';
    let rawText = textCol >= 0 && textCol < cols.length ? cols[textCol] : cols[cols.length - 1];

    if (!rawText && cols.length > 1) {
      rawText = cols[cols.length - 1];
    }
    if (!rawText) continue;

    // Se o campo de livro contiver formato combinado "Gênesis 1:1" ou "Gn 1,1" ou "1:1"
    const refMatch = rawBook.match(/^(.+?)\s+(\d+)[:.,](\d+)$/);
    if (refMatch) {
      rawBook = refMatch[1];
      rawChap = refMatch[2];
      rawVerse = refMatch[3];
    } else {
      // Se capítulo contiver formato "1:1" ou "1,1"
      const chapVerseMatch = String(rawChap).match(/^(\d+)[:.,](\d+)$/);
      if (chapVerseMatch) {
        rawChap = chapVerseMatch[1];
        rawVerse = chapVerseMatch[2];
      }
    }

    // Identifica o livro da Bíblia (índice 0 a 65)
    let bookIndex = -1;

    if (rawBook && rawBook.trim()) {
      // 1. Testa se o valor do livro é um número (1 a 66 ou 0 a 65)
      const bookNum = parseInt(rawBook, 10);
      if (!isNaN(bookNum)) {
        if (bookNum >= 1 && bookNum <= 66) {
          bookIndex = bookNum - 1;
        } else if (bookNum >= 0 && bookNum <= 65) {
          bookIndex = bookNum;
        }
      }

      // 2. Se não foi por número direto, pesquisa por normalização
      if (bookIndex === -1) {
        const norm = normalizeString(rawBook);
        if (BOOK_NORM_MAP[norm] !== undefined) {
          bookIndex = BOOK_NORM_MAP[norm];
        } else {
          const found = BIBLE_BOOKS.findIndex(b => {
            const nName = normalizeString(b.name);
            const nAbbr = normalizeString(b.abbr);
            return norm === nName || norm === nAbbr || nName.startsWith(norm) || norm.startsWith(nName);
          });
          if (found !== -1) {
            bookIndex = found;
          }
        }
      }
    }

    // Se o livro veio em branco (típico de linhas agrupadas no Excel), mantém o livro anterior
    if (bookIndex === -1) {
      bookIndex = lastBookIndex;
    } else {
      lastBookIndex = bookIndex;
    }

    if (bookIndex < 0 || bookIndex >= 66) continue;

    let chapNum = parseInt(rawChap, 10);
    if (isNaN(chapNum) || chapNum < 1) {
      chapNum = lastChapNum;
    } else {
      if (chapNum !== lastChapNum) {
        lastChapNum = chapNum;
        lastVerseNum = 0;
      }
    }

    let verseNum = parseInt(rawVerse, 10);
    if (isNaN(verseNum) || verseNum < 1) {
      verseNum = lastVerseNum + 1;
    }
    lastVerseNum = verseNum;

    const targetBook = books[bookIndex];

    // Garante que o array de capítulos possui tamanho suficiente
    while (targetBook.chapters.length < chapNum) {
      targetBook.chapters.push([]);
    }

    const chapArray = targetBook.chapters[chapNum - 1];

    // Se um texto de capítulo inteiro contiver múltiplos versículos juntos ("1 No princípio... 2 A terra...")
    // e o arquivo não separou versículos em linhas individuais
    if (verseNum === 1 && rawText.length > 500 && /\b2\s+[A-ZÀ-Ú]/.test(rawText)) {
      const parts = rawText.split(/\s*(\d+)\s+/).filter(Boolean);
      if (parts.length >= 4) {
        chapArray.length = 0;
        for (let p = 0; p < parts.length; p += 2) {
          const vText = parts[p + 1] ? `${parts[p + 1]}`.trim() : parts[p].trim();
          if (vText) chapArray.push(vText);
        }
        loadedVersesCount += chapArray.length;
        continue;
      }
    }

    // Preenche na posição do versículo correspondente
    while (chapArray.length < verseNum) {
      chapArray.push('');
    }
    chapArray[verseNum - 1] = rawText;
    loadedVersesCount++;
  }

  if (loadedVersesCount === 0) {
    throw new Error('Não foi possível identificar versículos válidos no formato CSV fornecido.');
  }

  // Limpa eventuais lacunas vazias
  for (const b of books) {
    for (let c = 0; c < b.chapters.length; c++) {
      if (b.chapters[c].length > 0) {
        b.chapters[c] = b.chapters[c].filter(v => v && v.trim().length > 0);
      }
    }
  }

  return books;
}
