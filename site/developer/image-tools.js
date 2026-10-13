(function(root){'use strict';
function trimBounds(pixels,width,height){let left=width,top=height,right=-1,bottom=-1;for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>8){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}return right<0?null:{left,top,width:right-left+1,height:bottom-top+1}}
function removeBackground(pixels,width,height,color,tolerance){const out=new Uint8ClampedArray(pixels),seen=new Uint8Array(width*height),queue=new Int32Array(width*height);let head=0,tail=0;function add(i){if(i<0||i>=seen.length||seen[i])return;seen[i]=1;const n=i*4;const distance=Math.max(Math.abs(out[n]-color[0]),Math.abs(out[n+1]-color[1]),Math.abs(out[n+2]-color[2]));if(out[n+3]===0||distance<=tolerance){queue[tail++]=i;out[n+3]=0}}for(let x=0;x<width;x++){add(x);add((height-1)*width+x)}for(let y=0;y<height;y++){add(y*width);add(y*width+width-1)}while(head<tail){const i=queue[head++],x=i%width;if(x>0)add(i-1);if(x<width-1)add(i+1);add(i-width);add(i+width)}return out}
function colorTransparency(pixels,color,tolerance,amount=100){const out=new Uint8ClampedArray(pixels),limit=Math.max(0,Math.min(255,Number(tolerance)||0)),opacity=1-Math.max(0,Math.min(100,Number(amount)||0))/100;for(let i=0;i<out.length;i+=4){const distance=Math.max(Math.abs(out[i]-color[0]),Math.abs(out[i+1]-color[1]),Math.abs(out[i+2]-color[2]));if(distance<=limit)out[i+3]=Math.round(out[i+3]*opacity)}return out}
function invertColors(pixels){const out=new Uint8ClampedArray(pixels);for(let i=0;i<out.length;i+=4)if(out[i+3])for(let c=0;c<3;c++)out[i+c]=255-out[i+c];return out}
function recolor(pixels,color){const out=new Uint8ClampedArray(pixels);for(let i=0;i<out.length;i+=4)if(out[i+3])for(let c=0;c<3;c++)out[i+c]=color[c];return out}
// Refine only visible boundary pixels: do not grow the logo into transparent areas.
// Pull fringe RGB toward a nearby solid pixel farther from the removed color.
function refineEdges(pixels,width,height,matte=[255,255,255],amount=40){
 const out=new Uint8ClampedArray(pixels),strength=Math.max(0,Math.min(100,Number(amount)||0))/100;
 if(!strength)return out;
 const distance=i=>Math.max(...matte.map((c,k)=>Math.abs(pixels[i+k]-c)));
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4,a=pixels[i+3];if(!a)continue;
  let boundary=a<255,total=0,count=0,best=-1,bestDistance=distance(i);
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;
   const j=(ny*width+nx)*4;total+=pixels[j+3];count++;
   if(pixels[j+3]===0)boundary=true;
   const d=distance(j);if(pixels[j+3]>=240&&d>bestDistance+20){best=j;bestDistance=d}
  }
  if(!boundary)continue;
  // A small blend reduces jagged steps, while preserving thin strokes and holes.
  out[i+3]=Math.round(a+(Math.min(a,total/count)-a)*strength*.35);
  if(best>=0)for(let c=0;c<3;c++)out[i+c]=Math.round(pixels[i+c]+(pixels[best+c]-pixels[i+c])*strength);
 }
 return out;
}
root.FiCardImageTools={trimBounds,removeBackground,colorTransparency,invertColors,recolor,refineEdges};if(typeof module!=='undefined')module.exports=root.FiCardImageTools;
})(typeof window!=='undefined'?window:globalThis);
