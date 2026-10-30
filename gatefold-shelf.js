/* Gatefold Reader — Quick-Open Shelf (100 classics, Gutenberg IDs verified 2026-10-30)
   Usage:  <script src="gatefold-shelf.js"></script>   then   GatefoldShelf.open()
   Tapping a book calls window.gfShelfOpen(book) if your app defines it
   (book = {id,title,author,epubUrl}); otherwise it opens the Gutenberg EPUB download. */
(function(){
var BOOKS=[[1342,"Pride and Prejudice","Austen, Jane"],[84,"Frankenstein","Shelley, Mary"],[2701,"Moby Dick","Melville, Herman"],[11,"Alice's Adventures in Wonderland","Carroll, Lewis"],[1661,"The Adventures of Sherlock Holmes","Doyle, Arthur Conan"],[174,"The Picture of Dorian Gray","Wilde, Oscar"],[345,"Dracula","Stoker, Bram"],[98,"A Tale of Two Cities","Dickens, Charles"],[64317,"The Great Gatsby","Fitzgerald, F. Scott"],[43,"Dr. Jekyll and Mr. Hyde","Stevenson, Robert Louis"],[2641,"A Room with a View","Forster, E. M."],[145,"Middlemarch","Eliot, George"],[1184,"The Count of Monte Cristo","Dumas, Alexandre"],[2680,"Meditations","Marcus Aurelius"],[16328,"Beowulf","Unknown"],[5200,"The Metamorphosis","Kafka, Franz"],[1952,"The Yellow Wallpaper","Gilman, Charlotte Perkins"],[1513,"Romeo and Juliet","Shakespeare, William"],[100,"Complete Works of William Shakespeare","Shakespeare, William"],[2600,"War and Peace","Tolstoy, Leo"],[1232,"The Prince","Machiavelli, Niccolo"],[65238,"The Secret of Chimneys","Christie, Agatha"],[16389,"The Enchanted April","Von Arnim, Elizabeth"],[844,"The Importance of Being Earnest","Wilde, Oscar"],[2554,"Crime and Punishment","Dostoevsky, Fyodor"],[76,"Adventures of Huckleberry Finn","Twain, Mark"],[514,"Little Women","Alcott, Louisa May"],[25344,"The Scarlet Letter","Hawthorne, Nathaniel"],[1259,"Twenty Years After","Dumas, Alexandre"],[2814,"Dubliners","Joyce, James"],[46,"A Christmas Carol","Dickens, Charles"],[2500,"Siddhartha","Hesse, Hermann"],[28054,"The Brothers Karamazov","Dostoevsky, Fyodor"],[74,"The Adventures of Tom Sawyer","Twain, Mark"],[1400,"Great Expectations","Dickens, Charles"],[35,"The Time Machine","Wells, H. G."],[36,"The War of the Worlds","Wells, H. G."],[2852,"The Hound of the Baskervilles","Doyle, Arthur Conan"],[161,"Sense and Sensibility","Austen, Jane"],[105,"Persuasion","Austen, Jane"],[158,"Emma","Austen, Jane"],[768,"Wuthering Heights","Bronte, Emily"],[1260,"Jane Eyre","Bronte, Charlotte"],[1399,"Anna Karenina","Tolstoy, Leo"],[45,"Anne of Green Gables","Montgomery, L. M."],[244,"A Study in Scarlet","Doyle, Arthur Conan"],[834,"The Memoirs of Sherlock Holmes","Doyle, Arthur Conan"],[1727,"The Odyssey","Homer"],[23,"Narrative of the Life of Frederick Douglass","Douglass, Frederick"],[60,"The Scarlet Pimpernel","Orczy, Baroness"],[829,"Gulliver's Travels","Swift, Jonathan"],[209,"The Turn of the Screw","James, Henry"],[5230,"The Invisible Man","Wells, H. G."],[55,"The Wonderful Wizard of Oz","Baum, L. Frank"],[215,"The Call of the Wild","London, Jack"],[2591,"Grimm's Fairy Tales","Grimm, Jacob"],[201,"Flatland","Abbott, Edwin A."],[242,"My Antonia","Cather, Willa"],[996,"Don Quixote","Cervantes"],[4300,"Ulysses","Joyce, James"],[1080,"A Modest Proposal","Swift, Jonathan"],[16,"Peter Pan","Barrie, J. M."],[236,"The Jungle Book","Kipling, Rudyard"],[11339,"Aesop's Fables","Aesop"],[120,"Treasure Island","Stevenson, Robert Louis"],[205,"Walden","Thoreau, Henry David"],[6130,"The Iliad","Homer"],[2097,"The Sign of the Four","Doyle, Arthur Conan"],[78,"Tarzan of the Apes","Burroughs, Edgar Rice"],[500,"The Adventures of Pinocchio","Collodi, Carlo"],[805,"This Side of Paradise","Fitzgerald, F. Scott"],[1998,"Thus Spoke Zarathustra","Nietzsche, Friedrich"],[132,"The Art of War","Sunzi"],[766,"David Copperfield","Dickens, Charles"],[730,"Oliver Twist","Dickens, Charles"],[219,"Heart of Darkness","Conrad, Joseph"],[160,"The Awakening","Chopin, Kate"],[73,"The Red Badge of Courage","Crane, Stephen"],[110,"Tess of the d'Urbervilles","Hardy, Thomas"],[10148,"Merry Adventures of Robin Hood","Pyle, Howard"],[103,"Around the World in Eighty Days","Verne, Jules"],[164,"Twenty Thousand Leagues under the Sea","Verne, Jules"],[3748,"A Journey to the Centre of the Earth","Verne, Jules"],[58585,"The Prophet","Gibran, Kahlil"],[2638,"The Idiot","Dostoevsky, Fyodor"],[108,"The Return of Sherlock Holmes","Doyle, Arthur Conan"],[1237,"Pere Goriot","Balzac, Honore de"],[20203,"Autobiography of Benjamin Franklin","Franklin, Benjamin"],[2397,"The Story of My Life","Keller, Helen"],[910,"White Fang","London, Jack"],[1074,"The Sea-Wolf","London, Jack"],[7849,"The Trial","Kafka, Franz"],[17396,"The Secret Garden","Burnett, Frances Hodgson"],[175,"The Phantom of the Opera","Leroux, Gaston"],[24,"O Pioneers!","Cather, Willa"],[143,"The Mayor of Casterbridge","Hardy, Thomas"],[41,"The Legend of Sleepy Hollow","Irving, Washington"],[2147,"Works of Edgar Allan Poe, Vol. 1","Poe, Edgar Allan"],[1251,"Le Morte d'Arthur, Vol. I","Malory, Thomas"],[550,"Silas Marner","Eliot, George"]];
var PAL=[["#5b1f1f","#e8d3a8"],["#1f3b2e","#e6dcc0"],["#1e2f4f","#e9dcb8"],["#4a3214","#f0dfb6"],
["#3d1f45","#ecd9b4"],["#24403f","#eadbb8"],["#5a3a18","#f3e2bd"],["#2b2b33","#e3cf9e"],
["#6a2a12","#f1ddb1"],["#203626","#e9d8ae"]];
function h(s){var x=0;for(var i=0;i<s.length;i++)x=(x*31+s.charCodeAt(i))|0;return Math.abs(x);}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function nice(a){var p=a.split(", ");return p.length===2?p[1]+" "+p[0]:a;}
var css='#gf-shelf{position:fixed;inset:0;z-index:99999;display:none;flex-direction:column;'+
'background:radial-gradient(ellipse at top,#3a2617 0%,#1c120b 70%);color:#f1e3c4;font-family:Georgia,"Times New Roman",serif}'+
'#gf-shelf.on{display:flex}'+
'#gf-shelf header{display:flex;align-items:center;gap:10px;padding:max(12px,env(safe-area-inset-top)) 16px 10px}'+
'#gf-shelf h2{margin:0;font-size:20px;font-weight:normal;letter-spacing:.04em;flex:1}'+
'#gf-shelf h2 small{display:block;font-size:12px;opacity:.6;letter-spacing:.08em}'+
'#gf-shelf .gfs-x{background:none;border:1px solid #f1e3c455;color:inherit;border-radius:50%;width:38px;height:38px;font-size:20px;line-height:1}'+
'#gf-shelf input{margin:0 16px 10px;padding:10px 14px;border-radius:22px;border:1px solid #f1e3c444;background:#00000040;color:inherit;font:16px Georgia,serif;outline:none}'+
'#gf-shelf .gfs-grid{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:6px 16px calc(24px + env(safe-area-inset-bottom));'+
'display:grid;grid-template-columns:repeat(auto-fill,minmax(98px,1fr));gap:22px 14px;align-content:start}'+
'#gf-shelf .gfs-b{all:unset;cursor:pointer;display:flex;flex-direction:column;gap:6px;-webkit-tap-highlight-color:transparent}'+
'#gf-shelf .gfs-c{position:relative;aspect-ratio:2/3;border-radius:2px 5px 5px 2px;padding:12% 10% 10% 16%;box-sizing:border-box;'+
'display:flex;flex-direction:column;justify-content:space-between;text-align:center;overflow:hidden;'+
'box-shadow:0 6px 10px #0009,inset 6px 0 0 #0000004d,inset 7px 0 0 #ffffff1a;transition:transform .15s}'+
'#gf-shelf .gfs-c:before{content:"";position:absolute;left:12%;right:8%;top:6%;bottom:6%;border:1px solid currentColor;opacity:.35;pointer-events:none}'+
'#gf-shelf .gfs-b:active .gfs-c{transform:translateY(-4px) scale(1.03)}'+
'#gf-shelf .gfs-t{font-size:12px;line-height:1.2;font-variant:small-caps;letter-spacing:.02em;margin-top:8%}'+
'#gf-shelf .gfs-a{font-size:9.5px;font-style:italic;opacity:.8}'+
'#gf-shelf .gfs-r{font-size:9px;opacity:.55}'+
'#gf-shelf .gfs-cap{font-size:11.5px;line-height:1.25;opacity:.85;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}'+
'#gf-shelf .gfs-none{grid-column:1/-1;text-align:center;opacity:.6;padding:40px 0}';
var root,grid,input;
function build(){
  if(root)return;
  var st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
  root=document.createElement("div");root.id="gf-shelf";
  root.innerHTML='<header><h2>Classics Shelf<small>100 BOOKS · TAP TO OPEN</small></h2>'+
    '<button class="gfs-x" aria-label="Close">×</button></header>'+
    '<input type="search" placeholder="Search title or author" autocomplete="off">'+
    '<div class="gfs-grid"></div>';
  document.body.appendChild(root);
  grid=root.querySelector(".gfs-grid");input=root.querySelector("input");
  var html="";
  BOOKS.forEach(function(b,i){
    var p=PAL[h(b[2])%PAL.length];
    html+='<button class="gfs-b" data-i="'+i+'" data-q="'+esc((b[1]+" "+nice(b[2])).toLowerCase())+'">'+
      '<div class="gfs-c" style="background:linear-gradient(100deg,'+p[0]+' 0%,'+p[0]+' 60%,#0000 140%),'+p[0]+';color:'+p[1]+'">'+
      '<div class="gfs-t">'+esc(b[1])+'</div><div><div class="gfs-a">'+esc(nice(b[2]))+'</div>'+
      '<div class="gfs-r">№ '+(i+1)+'</div></div></div>'+
      '<div class="gfs-cap">'+esc(b[1])+'</div></button>';
  });
  grid.innerHTML=html+'<div class="gfs-none" hidden>No matching books</div>';
  grid.addEventListener("click",function(e){
    var el=e.target.closest(".gfs-b");if(!el)return;
    var b=BOOKS[+el.dataset.i];
    var book={id:b[0],title:b[1],author:nice(b[2]),
      epubUrl:"https://www.gutenberg.org/ebooks/"+b[0]+".epub3.images"};
    if(typeof window.gfShelfOpen==="function"){close();window.gfShelfOpen(book);}
    else window.open(book.epubUrl,"_blank");
  });
  input.addEventListener("input",function(){
    var q=input.value.trim().toLowerCase(),n=0;
    grid.querySelectorAll(".gfs-b").forEach(function(el){
      var ok=!q||el.dataset.q.indexOf(q)>-1;el.hidden=!ok;if(ok)n++;});
    grid.querySelector(".gfs-none").hidden=n>0;
  });
  root.querySelector(".gfs-x").addEventListener("click",function(){close();});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&root.classList.contains("on"))close();});
  window.addEventListener("popstate",function(){if(root.classList.contains("on"))close(true);});
}
function open(){build();root.classList.add("on");grid.scrollTop=0;
  try{history.pushState({gfShelf:1},"");}catch(e){}}
function close(fromBack){if(!root||!root.classList.contains("on"))return;root.classList.remove("on");
  input.value="";input.dispatchEvent(new Event("input"));
  if(!fromBack&&history.state&&history.state.gfShelf){try{history.back();}catch(e){}}}
window.GatefoldShelf={open:open,close:close,books:BOOKS};
})();
