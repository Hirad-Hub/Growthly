interface AnalysisResult {
  fillerWords: string;
  clarityScore: string;
  suggestions: string[];
}

export function analyzeText(text: string): AnalysisResult {
  // Common filler words and weak phrases
  const fillerWords = [
    "um",
    "uh",
    "like",
    "you know",
    "basically",
    "actually",
    "sort of",
    "kind of",
    "i mean",
  ];
  const weakPhrases = ["i think", "maybe", "probably", "somewhat", "possibly"];
  const text_lower = text.toLowerCase();

  // Initialize analysis metrics
  const metrics = {
    fillerWordCount: 0,
    weakPhrasesCount: 0,
    longPauses: 0,
    totalWords: text.split(/\s+/).length,
    sentenceCount: text.split(/[.!?]+/).filter(Boolean).length,
    repeatedWords: new Map<string, number>(),
  };

  // Count filler words
  fillerWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = text_lower.match(regex);
    if (matches) {
      metrics.fillerWordCount += matches.length;
    }
  });

  // Count weak phrases
  weakPhrases.forEach((phrase) => {
    const regex = new RegExp(`\\b${phrase}\\b`, "gi");
    const matches = text_lower.match(regex);
    if (matches) {
      metrics.weakPhrasesCount += matches.length;
    }
  });

  // Analyze sentence structure
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const avgWordsPerSentence = metrics.totalWords / metrics.sentenceCount;

  // Find repeated words (excluding common words)
  const commonWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
  ]);
  const words = text_lower.split(/\s+/);
  words.forEach((word) => {
    if (!commonWords.has(word) && word.length > 2) {
      metrics.repeatedWords.set(
        word,
        (metrics.repeatedWords.get(word) || 0) + 1
      );
    }
  });

  // Generate detailed suggestions
  const suggestions: string[] = [];

  // Filler words feedback
  if (metrics.fillerWordCount > 0) {
    const fillerWordsFound = fillerWords.filter((word) =>
      new RegExp(`\\b${word}\\b`, "gi").test(text_lower)
    );
    suggestions.push(
      `Reduce filler words: "${fillerWordsFound.join('", "')}" appear ${
        metrics.fillerWordCount
      } times in your response.`
    );
  }

  // Weak phrases feedback
  if (metrics.weakPhrasesCount > 0) {
    suggestions.push(
      "Try to sound more confident by replacing uncertain phrases like 'I think' or 'maybe' with more assertive language."
    );
  }

  // Sentence structure feedback
  if (avgWordsPerSentence > 25) {
    suggestions.push(
      "Your sentences are quite long (average " +
        Math.round(avgWordsPerSentence) +
        " words). Consider breaking them into shorter, clearer statements."
    );
  } else if (avgWordsPerSentence < 8) {
    suggestions.push(
      "Your responses could benefit from more detailed explanations. Try to elaborate more on your points."
    );
  }

  // Word repetition feedback
  const overusedWords = Array.from(metrics.repeatedWords.entries())
    .filter(([_, count]) => count > 3)
    .map(([word]) => word);
  if (overusedWords.length > 0) {
    suggestions.push(
      `Consider using synonyms for frequently repeated words: "${overusedWords.join(
        '", "'
      )}"`
    );
  }

  // Analyze response length
  if (metrics.totalWords < 50) {
    suggestions.push(
      "Your response is quite brief. Consider providing more details and examples to strengthen your answer."
    );
  } else if (metrics.totalWords > 300) {
    suggestions.push(
      "Your response is quite lengthy. Try to be more concise while maintaining the key points."
    );
  }

  // Calculate clarity score
  const clarityScore = Math.max(
    0,
    Math.min(
      100,
      100 -
        metrics.fillerWordCount * 5 -
        metrics.weakPhrasesCount * 3 -
        Math.abs(avgWordsPerSentence - 15) -
        overusedWords.length * 2
    )
  );

  // If no issues found
  if (suggestions.length === 0) {
    suggestions.push(
      "Excellent response! Your answer was clear, concise, and professionally delivered."
    );
  }

  // Add positive reinforcement if score is good
  if (clarityScore > 80) {
    suggestions.unshift(
      "Overall, this was a strong response with good clarity and professional delivery."
    );
  }

  return {
    fillerWords: `Found ${metrics.fillerWordCount} filler words and ${metrics.weakPhrasesCount} uncertain phrases in your response of ${metrics.totalWords} words.`,
    clarityScore: `${clarityScore.toFixed(0)}/100`,
    suggestions,
  };
}
