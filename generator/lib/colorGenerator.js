
/**
 * @param {any} tinycolor the tinycolor library
 * @param {any} config The configuration object
 */
const generateColors = (tinycolor,config)=>{
   const semanticRules={};
   const fallBackRules=[];
   //In this section we compile metadata about the generated colors
   const baseNumber = Object.keys(config.baseTokenColors).length;
   const filterNumber = Object.keys(config.filters).length;
   const extraCombinationsNumber = config.modifierCombinations.length
   const numColors = (baseNumber*filterNumber)+(baseNumber*extraCombinationsNumber);
   //Counting modifier filters and colors that were defined manually.
   const manualColors = ((()=>{
      let manualFilters = 0
      for (const f in config.filters) {
         if (!Object.hasOwnProperty.call(config.filters, f)) continue;
         const filter = config.filters[f];
         for (const k in filter) (Object.hasOwnProperty.call(filter, k) && k !== 'default') && manualFilters++
      }
      return baseNumber+filterNumber+manualFilters
   })());
   //Putting everything into our "meta" object.
   const meta = {numColors,manualColors,baseNumber,filterNumber,extraCombinationsNumber,manualPercent:((manualColors / numColors) * 100).toFixed(2)}

   const applyColors= (base,variations)=>{
      const color = new tinycolor(config.baseTokenColors[base])
      variations.forEach(v=>{
         const def = config.filters[v][base]||config.filters[v].default;
         for (const k in def)((Object.hasOwnProperty.call(def, k)) && color[k](def[k]));
      })
      return color;
   }

   const encode=(color,text)=>{
      const finalColor =   color.toHexString();
      const finalText = text.replace(/\s+/g,'.');
      let rule =  finalColor

      const textMateTransform = r => {
         if(typeof rule ==='string')return {foreground:rule};
         let fontText = [];
         if(r.bold)fontText.push('bold');
         if(r.italic)fontText.push('italic');
         if(r.bold === false && r.italic === false)fontText = [''];
         return {foreground:r.foreground, fontStyle:fontText.join(' ')}
      }

      for (const f in config.textformatMapping) {
         if (!(Object.hasOwnProperty.call(config.textformatMapping, f) && (new RegExp(`\\b${f}\\b`,'gm'))).test(finalText)) continue;
         const formatDef = config.textformatMapping[f]
         if(typeof rule === 'string')rule = {foreground:rule};
         if(formatDef.clear) rule = {...rule, bold:false, italic:false};
         else rule = {...rule,...formatDef}
        }

      semanticRules[finalText] = rule;
      for (const k in config.alias) (Object.hasOwnProperty.call(config.alias, k) && (new RegExp(`\\b${k}\\b`,'gm')).test(finalText)) &&  config.alias[k].forEach(a=> semanticRules[finalText.replace(new RegExp(`\\b${k}\\b`, 'g'), a)] = (typeof rule === 'string'?{foreground:rule,alias:true}:{...rule,alias:true}) )
      if(config.fallbacks[finalText]) fallBackRules.push({name:finalText,scope:config.fallbacks[finalText],settings:textMateTransform(rule)})
   }

   for (const t in config.baseTokenColors) {
      if (!(Object.hasOwnProperty.call(config.baseTokenColors, t))) return;
      encode(new tinycolor(config.baseTokenColors[t]),t)
      for (const v in config.filters) ((Object.hasOwnProperty.call(config.filters, v)) && encode(applyColors(t,[v]),t+'\n'+v))
      config.modifierCombinations.map(c=>c.split('.')).forEach(c=> encode(applyColors(t,c),t+'\n'+c.join(' ')))
   }
   return {semanticRules,fallBackRules,meta};
}

/**
 * Ridiculously basic string interpolation to generate dynamic readme and html
 * @param {string} text Text wiht placholders
 * @param {Record<string,any>} replacements An object of key/value pairs to be interpolated into the text
 * @returns 
 */
const interpolate = (text,replacements) => {
   let finaltext = text
   for (const r in replacements) {
      if (!Object.prototype.hasOwnProperty.call(replacements, r)) continue;
      finaltext = finaltext.replace(new RegExp(`\{${r}\}`, 'gim'), replacements[r])
   } 
   return finaltext;
}

export {generateColors,interpolate}