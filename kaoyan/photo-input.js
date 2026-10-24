(function(){
'use strict';
window.KaoyanPhotos={mount(container){
 const root=document.createElement('div');root.className='photo-input';root.innerHTML='<div class="photo-actions"><button type="button" class="photo-choose">＋ 添加照片</button><button type="button" class="photo-camera">拍照</button></div><input class="photo-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden><input class="photo-capture" type="file" accept="image/*" capture="environment" hidden><div class="photo-preview" hidden><img alt="本次发送的照片预览"><div class="photo-actions"><button type="button" class="photo-remove">移除照片</button></div></div><p class="photo-status" aria-live="polite">可添加1张题目或笔记照片（8MB以内）。发送后由AI看图，原照片不存入聊天历史。</p>';container.append(root);
 const $=s=>root.querySelector(s);let attachment=null,working=false,error='',generation=0;
 $('.photo-choose').onclick=()=>$('.photo-file').click();$('.photo-camera').onclick=()=>$('.photo-capture').click();
 function clear(){generation++;attachment=null;working=false;error='';$('.photo-preview').hidden=true;$('.photo-preview img').removeAttribute('src');$('.photo-file').value='';$('.photo-capture').value='';$('.photo-status').textContent='可添加1张题目或笔记照片（8MB以内）。发送后由AI看图，原照片不存入聊天历史。'}
 $('.photo-remove').onclick=clear;
 async function load(file){clear();if(!file)return;const ticket=generation;
  if(file.size>8*1024*1024){error='照片超过8MB，请选择较小的照片。';$('.photo-status').textContent=error;return}
  if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)){error='请选择JPEG、PNG、WebP或GIF照片；HEIC请先转换为JPEG。';$('.photo-status').textContent=error;return}
  working=true;$('.photo-status').textContent='正在准备照片……';let url,bitmap;
  try{url=URL.createObjectURL(file);bitmap=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('无法读取这张照片，请换一张。'));img.src=url});if(ticket!==generation)return;if(!bitmap.naturalWidth||!bitmap.naturalHeight||bitmap.naturalWidth*bitmap.naturalHeight>60000000)throw Error('照片尺寸过大，请裁剪后再选。');const ratio=Math.min(1,1600/Math.max(bitmap.naturalWidth,bitmap.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(bitmap.naturalHeight*ratio));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);let dataUrl;for(const quality of [.88,.75,.6,.45]){dataUrl=canvas.toDataURL('image/jpeg',quality);if(dataUrl.length<2*1024*1024)break}if(dataUrl.length>=2*1024*1024)throw Error('压缩后照片仍过大，请裁剪题目区域再选。');if(ticket!==generation)return;attachment={dataUrl,mimeType:'image/jpeg',name:file.name.slice(0,120)||'photo.jpg'};$('.photo-preview img').src=dataUrl;$('.photo-preview').hidden=false;$('.photo-status').textContent='照片已准备好。可以附上问题一起发送；若题目或手写内容不清楚，AI会请你补充。';
  }catch(e){if(ticket===generation){error=e.message||'照片处理失败';$('.photo-status').textContent=error}}
  finally{if(url)URL.revokeObjectURL(url);if(ticket===generation)working=false}
 }
 $('.photo-file').onchange=e=>load(e.target.files[0]);$('.photo-capture').onchange=e=>load(e.target.files[0]);
 return {getText:()=>'',getAttachment:()=>attachment,clear,isBusy:()=>working,canSend:()=>!working&&!error,getError:()=>error};
}};
})();
