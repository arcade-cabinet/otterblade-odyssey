/**
 * NPC Procedural Renderer
 * 
 * Renders NPCs (Mother Riverstone, Abbot Oakenshield, etc.)
 * using Canvas 2D procedural generation with wordless gestures.
 * 
 * @module rendering/npc-renderer
 */

/**
 * Draw an NPC with current gesture/expression
 * 
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Object} position - Position {x, y}
 * @param {Object} npc - NPC data from DDL
 * @param {number} animFrame - Animation frame counter
 */
export function drawNPC(ctx, position, npc, animFrame = 0) {
  if (!ctx || !position || !npc) {
    console.error('Invalid parameters to drawNPC');
    return;
  }

  ctx.save();
  ctx.translate(position.x, position.y);

  const breathe = Math.sin(animFrame * 0.05) * 2;
  const gesture = npc.currentGesture || 'idle';
  const expression = npc.currentExpression || 'calm';

  // Draw based on NPC species
  switch (npc.species) {
    case 'otter':
      drawOtterNPC(ctx, npc, gesture, expression, animFrame, breathe);
      break;
    case 'badger':
      drawBadgerNPC(ctx, npc, gesture, expression, animFrame, breathe);
      break;
    case 'mouse':
      drawMouseNPC(ctx, npc, gesture, expression, animFrame, breathe);
      break;
    case 'hare':
      drawHareNPC(ctx, npc, gesture, expression, animFrame, breathe);
      break;
    default:
      drawGenericNPC(ctx, npc, gesture, expression, animFrame, breathe);
  }

  // Draw speech indicator if talking
  if (npc.isTalking) {
    drawSpeechIndicator(ctx, animFrame, breathe);
  }

  // Draw quest marker if available
  if (npc.hasQuest) {
    drawQuestMarker(ctx, animFrame);
  }

  ctx.restore();
}

/**
 * Draw otter NPC (like Mother Riverstone)
 * @private
 */
function drawOtterNPC(ctx, npc, gesture, expression, animFrame, breathe) {
  // Body (similar to Finn but with differences for NPC)
  ctx.fillStyle = npc.color || '#8B6F47';
  ctx.strokeStyle = '#6B5D4F';
  ctx.lineWidth = 2;
  
  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0 + breathe, 16, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.ellipse(0, -20 + breathe * 0.5, 14, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Draw facial expression
  drawExpression(ctx, expression, -20 + breathe * 0.5);

  // Draw gesture
  drawGesture(ctx, gesture, animFrame, breathe);

  // Clothing (simple robe for Mother Riverstone)
  if (npc.id === 'mother-riverstone') {
    ctx.fillStyle = '#8B4789';
    ctx.strokeStyle = '#6B3569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-12, 5 + breathe);
    ctx.lineTo(12, 5 + breathe);
    ctx.lineTo(10, 20 + breathe);
    ctx.lineTo(-10, 20 + breathe);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

/**
 * Draw badger NPC (like Abbot Oakenshield)
 * @private
 */
function drawBadgerNPC(ctx, npc, gesture, expression, animFrame, breathe) {
  // Badger body (stockier than otter)
  ctx.fillStyle = '#2C2C2C';
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = 2;
  
  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0 + breathe, 18, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // White chest stripe
  ctx.fillStyle = '#F5F5F5';
  ctx.beginPath();
  ctx.ellipse(2, 2 + breathe, 10, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head with distinctive badger stripes
  ctx.fillStyle = '#2C2C2C';
  ctx.beginPath();
  ctx.ellipse(0, -22 + breathe * 0.5, 15, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // White stripes on face
  ctx.fillStyle = '#F5F5F5';
  ctx.beginPath();
  ctx.ellipse(-6, -22 + breathe * 0.5, 3, 15, 0, 0, Math.PI * 2);
  ctx.ellipse(6, -22 + breathe * 0.5, 3, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Black stripe in middle
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(0, -22 + breathe * 0.5, 2, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw expression
  drawExpression(ctx, expression, -22 + breathe * 0.5);

  // Draw gesture
  drawGesture(ctx, gesture, animFrame, breathe);

  // Abbot robes
  if (npc.id === 'abbot-oakenshield') {
    ctx.fillStyle = '#8B4513';
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-14, 8 + breathe);
    ctx.lineTo(14, 8 + breathe);
    ctx.lineTo(12, 24 + breathe);
    ctx.lineTo(-12, 24 + breathe);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cord belt
    ctx.strokeStyle = '#F4E4C1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-12, 12 + breathe);
    ctx.lineTo(12, 12 + breathe);
    ctx.stroke();
  }
}

/**
 * Draw mouse NPC
 * @private
 */
function drawMouseNPC(ctx, npc, gesture, expression, animFrame, breathe) {
  // Mouse body (smaller, slender)
  ctx.fillStyle = npc.color || '#A0866F';
  ctx.strokeStyle = '#7A6655';
  ctx.lineWidth = 1.5;
  
  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0 + breathe, 10, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.ellipse(0, -16 + breathe * 0.5, 9, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Big ears
  ctx.fillStyle = '#D4A574';
  ctx.strokeStyle = '#7A6655';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(-8, -20 + breathe * 0.5, 5, 0, Math.PI * 2);
  ctx.arc(8, -20 + breathe * 0.5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner ear
  ctx.fillStyle = '#FFB6C1';
  ctx.beginPath();
  ctx.arc(-8, -20 + breathe * 0.5, 3, 0, Math.PI * 2);
  ctx.arc(8, -20 + breathe * 0.5, 3, 0, Math.PI * 2);
  ctx.fill();

  // Draw expression
  drawExpression(ctx, expression, -16 + breathe * 0.5, 0.8); // Smaller scale

  // Draw gesture
  drawGesture(ctx, gesture, animFrame, breathe, 0.8); // Smaller scale

  // Long tail
  ctx.strokeStyle = '#A0866F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, 12 + breathe);
  const tailWave = Math.sin(animFrame * 0.1) * 5;
  ctx.quadraticCurveTo(-15, 15 + breathe + tailWave, -18, 8 + breathe);
  ctx.stroke();
}

/**
 * Draw hare NPC
 * @private
 */
function drawHareNPC(ctx, npc, gesture, expression, animFrame, breathe) {
  // Hare body (tall, athletic)
  ctx.fillStyle = npc.color || '#D2B48C';
  ctx.strokeStyle = '#A89968';
  ctx.lineWidth = 1.5;
  
  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0 + breathe, 12, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.ellipse(0, -24 + breathe * 0.5, 11, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Long ears
  const earFlick = Math.sin(animFrame * 0.15) * 3;
  ctx.fillStyle = '#D2B48C';
  ctx.strokeStyle = '#A89968';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(-6, -38 + breathe * 0.5 + earFlick, 4, 12, 0, 0, Math.PI * 2);
  ctx.ellipse(6, -38 + breathe * 0.5 - earFlick, 4, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner ear
  ctx.fillStyle = '#FFB6C1';
  ctx.beginPath();
  ctx.ellipse(-6, -38 + breathe * 0.5 + earFlick, 2, 8, 0, 0, Math.PI * 2);
  ctx.ellipse(6, -38 + breathe * 0.5 - earFlick, 2, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw expression
  drawExpression(ctx, expression, -24 + breathe * 0.5);

  // Draw gesture
  drawGesture(ctx, gesture, animFrame, breathe);
}

/**
 * Draw generic NPC
 * @private
 */
function drawGenericNPC(ctx, npc, gesture, expression, animFrame, breathe) {
  ctx.fillStyle = npc.color || '#8B7355';
  ctx.strokeStyle = '#6B5345';
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  ctx.ellipse(0, 0 + breathe, 14, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, -18 + breathe * 0.5, 12, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  drawExpression(ctx, expression, -18 + breathe * 0.5);
  drawGesture(ctx, gesture, animFrame, breathe);
}

/**
 * Draw facial expression (wordless emotion)
 * @private
 */
function drawExpression(ctx, expression, headY, scale = 1) {
  ctx.fillStyle = '#2C2C2C';
  
  switch (expression) {
    case 'happy':
      // Smiling eyes
      ctx.beginPath();
      ctx.arc(-4 * scale, headY - 2, 2 * scale, 0, Math.PI);
      ctx.arc(4 * scale, headY - 2, 2 * scale, 0, Math.PI);
      ctx.fill();
      break;
    
    case 'worried':
      // Wide eyes
      ctx.beginPath();
      ctx.arc(-4 * scale, headY - 2, 3 * scale, 0, Math.PI * 2);
      ctx.arc(4 * scale, headY - 2, 3 * scale, 0, Math.PI * 2);
      ctx.fill();
      break;
    
    case 'sad':
      // Downcast eyes
      ctx.beginPath();
      ctx.arc(-4 * scale, headY, 2 * scale, Math.PI, 0);
      ctx.arc(4 * scale, headY, 2 * scale, Math.PI, 0);
      ctx.fill();
      break;
    
    case 'determined':
      // Focused eyes
      ctx.fillStyle = '#FF4500';
      ctx.beginPath();
      ctx.arc(-4 * scale, headY - 2, 2.5 * scale, 0, Math.PI * 2);
      ctx.arc(4 * scale, headY - 2, 2.5 * scale, 0, Math.PI * 2);
      ctx.fill();
      break;
    
    default: // calm
      // Normal eyes
      ctx.beginPath();
      ctx.arc(-4 * scale, headY - 2, 2 * scale, 0, Math.PI * 2);
      ctx.arc(4 * scale, headY - 2, 2 * scale, 0, Math.PI * 2);
      ctx.fill();
  }
}

/**
 * Draw body gesture (wordless communication)
 * @private
 */
function drawGesture(ctx, gesture, animFrame, breathe, scale = 1) {
  ctx.strokeStyle = '#6B5D4F';
  ctx.lineWidth = 2 * scale;
  const wave = Math.sin(animFrame * 0.1) * 5;

  switch (gesture) {
    case 'wave':
      // Arm raised, waving
      ctx.beginPath();
      ctx.moveTo(12 * scale, -8 * scale + breathe);
      ctx.lineTo(18 * scale + wave, -18 * scale + breathe);
      ctx.stroke();
      break;
    
    case 'point':
      // Arm extended, pointing
      ctx.beginPath();
      ctx.moveTo(12 * scale, -5 * scale + breathe);
      ctx.lineTo(25 * scale, -8 * scale + breathe);
      ctx.stroke();
      break;
    
    case 'beckon':
      // Arm bent, beckoning
      ctx.beginPath();
      ctx.moveTo(12 * scale, -5 * scale + breathe);
      ctx.lineTo(20 * scale, -12 * scale + breathe + wave);
      ctx.stroke();
      break;
    
    case 'crossed':
      // Arms crossed
      ctx.beginPath();
      ctx.moveTo(-12 * scale, -2 * scale + breathe);
      ctx.lineTo(8 * scale, -2 * scale + breathe);
      ctx.moveTo(12 * scale, -2 * scale + breathe);
      ctx.lineTo(-8 * scale, -2 * scale + breathe);
      ctx.stroke();
      break;
    
    case 'open':
      // Arms outstretched
      ctx.beginPath();
      ctx.moveTo(-12 * scale, -5 * scale + breathe);
      ctx.lineTo(-22 * scale, -8 * scale + breathe);
      ctx.moveTo(12 * scale, -5 * scale + breathe);
      ctx.lineTo(22 * scale, -8 * scale + breathe);
      ctx.stroke();
      break;
    
    default: // idle - arms at sides
      ctx.beginPath();
      ctx.moveTo(-10 * scale, -2 * scale + breathe);
      ctx.lineTo(-10 * scale, 8 * scale + breathe);
      ctx.moveTo(10 * scale, -2 * scale + breathe);
      ctx.lineTo(10 * scale, 8 * scale + breathe);
      ctx.stroke();
  }
}

/**
 * Draw speech indicator (shows NPC is talking)
 * @private
 */
function drawSpeechIndicator(ctx, animFrame, breathe) {
  const bubble1 = Math.abs(Math.sin(animFrame * 0.15)) * 2;
  const bubble2 = Math.abs(Math.sin(animFrame * 0.15 + 0.5)) * 2;
  const bubble3 = Math.abs(Math.sin(animFrame * 0.15 + 1)) * 2;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1;

  // Three dots
  ctx.beginPath();
  ctx.arc(8, -35 + breathe - bubble1, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(14, -35 + breathe - bubble2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(20, -35 + breathe - bubble3, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

/**
 * Draw quest marker above NPC
 * @private
 */
function drawQuestMarker(ctx, animFrame) {
  const float = Math.sin(animFrame * 0.1) * 3;
  
  ctx.fillStyle = '#FFD700';
  ctx.strokeStyle = '#FFA500';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(0, -42 + float);
  ctx.lineTo(-4, -35 + float);
  ctx.lineTo(-1.5, -35 + float);
  ctx.lineTo(-2, -32 + float);
  ctx.lineTo(0, -34 + float);
  ctx.lineTo(2, -32 + float);
  ctx.lineTo(1.5, -35 + float);
  ctx.lineTo(4, -35 + float);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner glow
  ctx.fillStyle = '#FFFF00';
  ctx.beginPath();
  ctx.moveTo(0, -40 + float);
  ctx.lineTo(-2, -36 + float);
  ctx.lineTo(2, -36 + float);
  ctx.closePath();
  ctx.fill();
}
