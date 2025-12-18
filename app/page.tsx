'use client';

import { useState, useEffect } from 'react';
import { UnicodeBMPPool, initUnicodeData } from '@/lib/unicode';

export default function Home() {
  const [pool, setPool] = useState<UnicodeBMPPool | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [character, setCharacter] = useState('?');
  const [characterName, setCharacterName] = useState('Click Draw to start');
  const [characterId, setCharacterId] = useState('—');
  const [cardColor, setCardColor] = useState('#555555');
  const [cardDescription, setCardDescription] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  // Initialize the pool when component mounts
  useEffect(() => {
    async function initialize() {
      try {
        await initUnicodeData();
        const newPool = new UnicodeBMPPool();
        await newPool.initialize();
        setPool(newPool);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize:', error);
        setCharacter('❌');
        setCharacterName('Failed to load Unicode data');
        setCharacterId('Error');
        setIsLoading(false);
      }
    }
    initialize();
  }, []);

  // Draw function with animation
  const handleDraw = async () => {
    if (isDrawing || !pool) return;
    
    setIsDrawing(true);
    setIsAnimating(true);
    
    // Start animation
    setCharacterName('??????????');
    setCharacterId('U+????');
    setCardColor('#555555');
    setCardDescription('');
    
    // Wait for animation to complete
    const randomDisplay = pool.draw(50);
    console.log(randomDisplay);
    for (let i = 0; i < 50; i++) {
      await new Promise(resolve => setTimeout(resolve, 40));
      setCharacter(randomDisplay[i].char);
    }
    
    // Draw from pool
    const result = pool.draw()[0];
    
    if (result) {
      // Display the result
      setCharacter(result.char);
      setCharacterName(result.name);
      setCharacterId(`U+${result.id.toString(16).toUpperCase().padStart(4, '0')}`);
      setCardColor(result.blockColor);
      setCardDescription(result.description);
    } else {
      setCharacter('?');
      setCharacterName('No result');
      setCharacterId('—');
      setCardDescription('');
    }
    
    // Remove animation class
    setIsAnimating(false);
    setIsDrawing(false);
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#667eea] to-[#764ba2] overflow-hidden">
      <h1 className="text-white mb-2 md:mb-4 text-2xl md:text-3xl font-bold drop-shadow-lg flex-shrink-0">
        Unicode Gacha
      </h1>
      
      <div className="w-full max-w-[400px] flex-1 flex flex-col justify-center items-center mb-2 md:mb-4 min-h-0">
        <div className={`bg-white rounded-3xl p-3 md:p-4 shadow-2xl w-full aspect-[5/7] flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-3xl overflow-hidden`} style={{ backgroundColor: cardColor }}>
          {/* Top section: Name and ID */}
          <div className={`flex justify-between items-center mb-2 flex-shrink-0 rounded-2xl p-2 bg-gray-50`}>
            <div className="text-lg md:text-base font-semibold text-gray-800 flex-1 text-left truncate pr-2">
              {characterName}
            </div>
            <div className="text-lg md:text-base text-gray-600 font-mono tracking-wide whitespace-nowrap">
              {characterId}
            </div>
          </div>
          
          {/* Middle section: Character display (takes remaining space above description) */}
          <div
            className="text-[120px] md:text-[160px] leading-none flex-1 flex items-center justify-center border-[10px] rounded-2xl bg-gray-50 mb-2 transition-all duration-300 min-h-0 aspect-[1/1] border-gray-300 flex-shrink-0"
          >
            {character}
          </div>
          
          {/* Bottom section: Description box (exactly half the card height) */}
          <div className="flex-shrink-0 rounded-2xl bg-gray-50 p-4 overflow-y-auto" style={{ height: '50%', maxHeight: '50%', minHeight: '50%' }}>
            <div className="text-md text-gray-600 text-left whitespace-pre-wrap">
              {cardDescription}
            </div>
          </div>
        </div>
      </div>
      
      <button
        onClick={handleDraw}
        disabled={isLoading || isDrawing}
        className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white border-none py-2 md:py-3 px-6 md:px-10 text-base md:text-lg font-semibold rounded-full cursor-pointer shadow-lg transition-all duration-300 uppercase tracking-wide disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:shadow-lg flex-shrink-0"
      >
        {isLoading ? 'Loading...' : 'Draw'}
      </button>
    </div>
  );
}
