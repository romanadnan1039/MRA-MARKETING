
(function(){
    const STATE_KEY = 'mra_marketing_advanced_cms_v2';
    let isEditMode = false;
    
    // Hidden trigger
    const footerDisclaimer = document.querySelector('footer .disclaimer');
    if (footerDisclaimer) {
        let clickCount = 0;
        let clickTimer;
        footerDisclaimer.addEventListener('click', () => {
            if (isEditMode) return;
            clickCount++;
            clearTimeout(clickTimer);
            if (clickCount >= 3) {
                const pass = prompt('Enter Admin Password:');
                if (pass === 'admin123') {
                    enableEditMode();
                } else {
                    alert('Incorrect.');
                }
                clickCount = 0;
            } else {
                clickTimer = setTimeout(() => {
                    clickCount = 0;
                }, 1000);
            }
        });
    }

    function createToolbar() {
        const tb = document.createElement('div');
        tb.className = 'cms-toolbar';
        tb.id = 'cms-toolbar';
        
        const btnSave = document.createElement('button');
        btnSave.innerText = 'Save Changes';
        btnSave.onclick = saveChanges;
        
        const btnExport = document.createElement('button');
        btnExport.innerText = 'Export JSON';
        btnExport.onclick = exportJson;
        
        const btnImport = document.createElement('button');
        btnImport.innerText = 'Import JSON';
        btnImport.onclick = () => document.getElementById('cms-file-import').click();
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'cms-file-import';
        fileInput.style.display = 'none';
        fileInput.accept = '.json';
        fileInput.onchange = importJson;
        
        const btnReset = document.createElement('button');
        btnReset.innerText = 'Reset';
        btnReset.onclick = resetChanges;
        
        const btnExit = document.createElement('button');
        btnExit.innerText = 'Exit Edit Mode';
        btnExit.onclick = disableEditMode;
        
        tb.append(btnSave, btnExport, btnImport, fileInput, btnReset, btnExit);
        document.body.appendChild(tb);
    }

    function enableEditMode() {
        isEditMode = true;
        document.body.classList.add('edit-mode');
        if(!document.getElementById('cms-toolbar')) createToolbar();
        else document.getElementById('cms-toolbar').classList.remove('cms-hidden');
        
        // Setup Text Editing
        document.querySelectorAll('h1, h2, h3, p, .btn-outline, .btn-gold, .quote, .stat .num, .stat .label, .tag, .pill').forEach((el, index) => {
            if (!el.id) el.id = 'cms-text-' + index;
            if (el.children.length === 0 || el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'P') {
                el.setAttribute('data-editable', 'true');
                el.contentEditable = "true";
            }
        });
        // Setup VSL Editing
        const vslFrame = document.querySelector('.video-frame');
        if(vslFrame && !vslFrame.querySelector('.cms-vsl-edit')) {
            const overlay = document.createElement('div');
            overlay.className = 'cms-vsl-edit';
            overlay.style.position = 'absolute'; overlay.style.top = '0'; overlay.style.left = '0'; overlay.style.right = '0'; overlay.style.bottom = '0';
            overlay.style.background = 'rgba(0,0,0,0.8)'; overlay.style.color = '#fff'; overlay.style.display = 'flex';
            overlay.style.flexDirection = 'column'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center';
            overlay.style.gap = '10px'; overlay.style.opacity = '0'; overlay.style.transition = 'opacity 0.2s'; overlay.style.zIndex = '9999';

            vslFrame.addEventListener('mouseenter', () => overlay.style.opacity = '1');
            vslFrame.addEventListener('mouseleave', () => overlay.style.opacity = '0');

            const btnReplace = document.createElement('button'); btnReplace.className = 'cms-media-btn'; btnReplace.innerText = 'Replace Video';
            const fileIn = document.createElement('input'); fileIn.type = 'file'; fileIn.accept = 'video/*'; fileIn.style.display = 'none';
            btnReplace.onclick = (e) => { e.preventDefault(); fileIn.click(); };
            
            fileIn.onchange = (e) => {
                const file = e.target.files[0];
                if(!file) return;
                if(file.size > 5 * 1024 * 1024) alert("Warning: Large videos may exceed local storage limits. Keep under 5MB for this demo.");
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const exVid = vslFrame.querySelector('video.vsl-video, iframe.vsl-video');
                    if(exVid) exVid.remove();
                    const vid = document.createElement('video'); vid.className = 'vsl-video'; vid.src = evt.target.result; vid.controls = true;
                    vid.style.width = '100%'; vid.style.height = '100%'; vid.style.objectFit = 'cover'; vid.style.position = 'absolute'; vid.style.top = '0'; vid.style.left = '0'; vid.style.zIndex = '5';
                    vslFrame.appendChild(vid);
                    vslFrame.classList.remove('vsl-empty');
                };
                reader.readAsDataURL(file);
            };

            const btnEmbed = document.createElement('button'); btnEmbed.className = 'cms-media-btn'; btnEmbed.innerText = 'Embed URL (Wistia)';
            btnEmbed.onclick = (e) => {
                e.preventDefault();
                const url = prompt("Enter video URL (e.g. Wistia embed link or .mp4):");
                if(!url) return;
                const exVid = vslFrame.querySelector('video.vsl-video, iframe.vsl-video');
                if(exVid) exVid.remove();
                if(url.includes('.mp4')) {
                    const vid = document.createElement('video'); vid.className = 'vsl-video'; vid.src = url; vid.controls = true;
                    vid.style.width = '100%'; vid.style.height = '100%'; vid.style.objectFit = 'cover'; vid.style.position = 'absolute'; vid.style.top = '0'; vid.style.left = '0'; vid.style.zIndex = '5';
                    vslFrame.appendChild(vid);
                } else {
                    const ifr = document.createElement('iframe'); ifr.className = 'vsl-video'; ifr.src = url;
                    ifr.allow = "autoplay; fullscreen"; ifr.style.width = '100%'; ifr.style.height = '100%'; ifr.style.position = 'absolute'; ifr.style.top = '0'; ifr.style.left = '0'; ifr.style.zIndex = '5'; ifr.style.border = 'none';
                    vslFrame.appendChild(ifr);
                }
                vslFrame.classList.remove('vsl-empty');
            };

            const btnRatio = document.createElement('button'); btnRatio.className = 'cms-media-btn'; btnRatio.innerText = 'Toggle Ratio';
            btnRatio.onclick = (e) => {
                e.preventDefault();
                if(vslFrame.classList.contains('ratio-9-16')) { vslFrame.classList.remove('ratio-9-16'); vslFrame.classList.add('ratio-16-9'); }
                else { vslFrame.classList.remove('ratio-16-9'); vslFrame.classList.add('ratio-9-16'); }
            };

            const btnRemove = document.createElement('button'); btnRemove.className = 'cms-media-btn'; btnRemove.innerText = 'Remove Video'; btnRemove.style.background = '#aa3333';
            btnRemove.onclick = (e) => { e.preventDefault(); const exVid = vslFrame.querySelector('video.vsl-video, iframe.vsl-video'); if(exVid) exVid.remove(); vslFrame.classList.add('vsl-empty'); };

            const btnRestore = document.createElement('button'); btnRestore.className = 'cms-media-btn'; btnRestore.innerText = 'Restore Default'; btnRestore.style.background = '#444';
            btnRestore.onclick = (e) => { e.preventDefault(); const exVid = vslFrame.querySelector('video.vsl-video, iframe.vsl-video'); if(exVid) exVid.remove(); vslFrame.classList.remove('vsl-empty'); };

            overlay.append(btnReplace, btnEmbed, btnRatio, btnRemove, btnRestore, fileIn);
            vslFrame.appendChild(overlay);
        }

        // Setup Media Editing
        document.querySelectorAll('img, video, iframe').forEach((el, index) => {
            if (!el.id) el.id = 'cms-media-' + index;
            const parent = el.parentElement;
            if(!parent.classList.contains('cms-media-container')) {
                parent.classList.add('cms-media-container');
                const overlay = document.createElement('div');
                overlay.className = 'cms-media-edit';
                
                const btn = document.createElement('button');
                btn.className = 'cms-media-btn';
                btn.innerText = 'Replace ' + (el.tagName === 'IMG' ? 'Image' : 'Video');
                
                const fileIn = document.createElement('input');
                fileIn.type = 'file';
                fileIn.accept = el.tagName === 'IMG' ? 'image/*' : 'video/*';
                fileIn.style.display = 'none';
                
                fileIn.onchange = (e) => {
                    const file = e.target.files[0];
                    if(!file) return;
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        if(el.tagName === 'VIDEO' || el.tagName === 'IFRAME') {
                            const newVid = document.createElement('video');
                            newVid.className = 'testi-media';
                            newVid.style.width = '100%'; newVid.style.height = '100%'; newVid.style.objectFit = 'cover'; newVid.style.position = 'absolute'; newVid.style.top = '0'; newVid.style.left = '0';
                            newVid.src = evt.target.result;
                            newVid.controls = true;
                            el.replaceWith(newVid);
                            disableEditMode(); enableEditMode();
                        } else {
                            el.src = evt.target.result;
                        }
                    };
                    reader.readAsDataURL(file);
                };
                
                btn.onclick = (e) => { e.preventDefault(); fileIn.click(); };
                overlay.append(btn, fileIn);
                
                if (parent.classList.contains('testi-photo')) {
                    const btnEmbed = document.createElement('button');
                    btnEmbed.className = 'cms-media-btn'; btnEmbed.innerText = 'Embed URL';
                    btnEmbed.onclick = (e) => {
                        e.preventDefault();
                        const url = prompt("Enter video URL (e.g. Wistia embed link or .mp4):");
                        if(!url) return;
                        if(url.includes('.mp4')) {
                            const newVid = document.createElement('video'); newVid.className = 'testi-media';
                            newVid.style.width = '100%'; newVid.style.height = '100%'; newVid.style.objectFit = 'cover'; newVid.style.position = 'absolute'; newVid.style.top = '0'; newVid.style.left = '0';
                            newVid.src = url; newVid.controls = true;
                            el.replaceWith(newVid);
                        } else {
                            const ifr = document.createElement('iframe'); ifr.className = 'testi-media'; ifr.src = url;
                            ifr.allow = "autoplay; fullscreen"; ifr.style.width = '100%'; ifr.style.height = '100%'; ifr.style.position = 'absolute'; ifr.style.top = '0'; ifr.style.left = '0'; ifr.style.border = 'none';
                            el.replaceWith(ifr);
                        }
                        disableEditMode(); enableEditMode();
                    };
                    
                    const btnRatio = document.createElement('button');
                    btnRatio.className = 'cms-media-btn'; btnRatio.innerText = 'Toggle Ratio';
                    btnRatio.onclick = (e) => {
                        e.preventDefault();
                        if(parent.classList.contains('ratio-9-16')) { parent.classList.remove('ratio-9-16'); parent.classList.add('ratio-16-9'); }
                        else if(parent.classList.contains('ratio-16-9')) { parent.classList.remove('ratio-16-9'); parent.classList.add('ratio-4-3'); }
                        else { parent.classList.remove('ratio-4-3'); parent.classList.add('ratio-9-16'); }
                    };
                    overlay.append(btnEmbed, btnRatio);
                }
                
                parent.append(overlay);
            }
        });

        // Setup Card Controls
        const cardSelectors = ['.obj-card', '.step', '.testi-card'];
        cardSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(card => {
                if(!card.classList.contains('cms-card-wrapper')) {
                    card.classList.add('cms-card-wrapper');
                    const controls = document.createElement('div');
                    controls.className = 'cms-card-controls';
                    
                    const btnAdd = document.createElement('button');
                    btnAdd.className = 'cms-card-btn';
                    btnAdd.innerText = '+';
                    btnAdd.title = "Duplicate";
                    btnAdd.onclick = () => {
                        const clone = card.cloneNode(true);
                        // cleanup clone ids so they get reassigned
                        clone.querySelectorAll('[id]').forEach(c => c.removeAttribute('id'));
                        card.parentNode.insertBefore(clone, card.nextSibling);
                        disableEditMode();
                        enableEditMode(); // re-init
                    };
                    
                    const btnDel = document.createElement('button');
                    btnDel.className = 'cms-card-btn';
                    btnDel.innerText = '×';
                    btnDel.title = "Remove";
                    btnDel.onclick = () => {
                        if(confirm("Remove this item?")) card.remove();
                    };

                    const btnUp = document.createElement('button');
                    btnUp.className = 'cms-card-btn'; btnUp.innerText = '↑'; btnUp.title = "Move Up";
                    btnUp.onclick = () => { if(card.previousElementSibling) card.parentNode.insertBefore(card, card.previousElementSibling); };

                    const btnDown = document.createElement('button');
                    btnDown.className = 'cms-card-btn'; btnDown.innerText = '↓'; btnDown.title = "Move Down";
                    btnDown.onclick = () => { if(card.nextElementSibling && !card.nextElementSibling.classList.contains('cms-card-controls')) card.parentNode.insertBefore(card.nextElementSibling, card); };

                    controls.appendChild(btnUp);
                    controls.appendChild(btnDown);
                    controls.appendChild(btnAdd);
                    controls.appendChild(btnDel);
                    card.appendChild(controls);
                }
            });
        });

        // Setup Testi Grid Container Controls
        const testiGrid = document.getElementById('testi-grid-container');
        if(testiGrid && !testiGrid.querySelector('.cms-grid-controls')) {
            const gridControls = document.createElement('div');
            gridControls.className = 'cms-grid-controls';
            gridControls.style.position = 'absolute';
            gridControls.style.top = '-40px';
            gridControls.style.right = '0';
            gridControls.style.display = 'flex';
            gridControls.style.gap = '10px';
            testiGrid.style.position = 'relative';

            const addVid = document.createElement('button');
            addVid.innerText = '+ Add Video Testimonial';
            addVid.className = 'cms-media-btn';
            addVid.onclick = () => {
                const tmpl = `<div class="testi-card cms-card-wrapper" data-type="video"><div class="testi-photo"><span class="tag">Pest Control</span><span class="play"></span><video class="testi-media" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0;"></video></div><div class="testi-body"><div class="quote" data-editable="true" contenteditable="true">"Incredible results right from week one."</div><div class="stat-row"><div><div class="s-num" data-editable="true" contenteditable="true">25+</div><div class="s-label" data-editable="true" contenteditable="true">New Jobs</div></div></div><div class="biz" data-editable="true" contenteditable="true">Elite Pest Control</div></div></div>`;
                testiGrid.insertAdjacentHTML('beforeend', tmpl);
                disableEditMode(); enableEditMode();
            };

            const addImg = document.createElement('button');
            addImg.innerText = '+ Add Image Testimonial';
            addImg.className = 'cms-media-btn';
            addImg.onclick = () => {
                const tmpl = `<div class="testi-card cms-card-wrapper" data-type="static-image"><div class="testi-photo"><span class="tag">Pest Control</span><img class="testi-media" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0;" /></div><div class="testi-body"><div class="quote" data-editable="true" contenteditable="true">"The best marketing investment we've ever made."</div><div class="stat-row"><div><div class="s-num" data-editable="true" contenteditable="true">$20k</div><div class="s-label" data-editable="true" contenteditable="true">Added Revenue</div></div></div><div class="biz" data-editable="true" contenteditable="true">Pro-Tech Exterminators</div></div></div>`;
                testiGrid.insertAdjacentHTML('beforeend', tmpl);
                disableEditMode(); enableEditMode();
            };

            const restoreDef = document.createElement('button');
            restoreDef.innerText = 'Restore Defaults';
            restoreDef.className = 'cms-media-btn';
            restoreDef.style.background = '#444';
            restoreDef.onclick = () => {
                if(confirm("Erase all testimonials and restore defaults?")) {
                    testiGrid.innerHTML = `<div class="testi-card" data-type="video"><div class="testi-photo"><span class="tag">Pest Control</span><span class="play"></span><video class="testi-media" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0;"></video></div><div class="testi-body"><div class="quote">"MRA's system completely changed how we acquire customers. The lead quality is unmatched."</div><div class="stat-row"><div><div class="s-num">42+</div><div class="s-label">Booked Inspections</div></div></div><div class="biz">Apex Pest Control</div></div></div><div class="testi-card" data-type="static-image"><div class="testi-photo"><span class="tag">Pest Control</span><img class="testi-media" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0;" /></div><div class="testi-body"><div class="quote">"We've tried buying leads before, but this is different. These are actual booked appointments."</div><div class="stat-row"><div><div class="s-num">$35k</div><div class="s-label">Closed In 90 Days</div></div></div><div class="biz">Shield Pest Solutions</div></div></div><div class="testi-card" data-type="video"><div class="testi-photo"><span class="tag">Pest Control</span><span class="play"></span><video class="testi-media" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0;"></video></div><div class="testi-body"><div class="quote">"Our technicians are fully booked out two weeks in advance. The ROI is incredible."</div><div class="stat-row"><div><div class="s-num">18</div><div class="s-label">New Recurring Plans</div></div></div><div class="biz">Guardian Pest Management</div></div></div>`;
                    disableEditMode(); enableEditMode();
                }
            };

            gridControls.appendChild(addVid);
            gridControls.appendChild(addImg);
            gridControls.appendChild(restoreDef);
            testiGrid.appendChild(gridControls);
        }
    }

    function disableEditMode() {
        isEditMode = false;
        document.body.classList.remove('edit-mode');
        document.querySelectorAll('.cms-vsl-edit, .cms-grid-controls').forEach(el => el.remove());
        document.getElementById('cms-toolbar').classList.add('cms-hidden');
        document.querySelectorAll('[data-editable="true"]').forEach(el => {
            el.contentEditable = "false";
            el.removeAttribute('data-editable');
        });
        document.querySelectorAll('.cms-media-edit, .cms-card-controls').forEach(el => el.remove());
        document.querySelectorAll('.cms-media-container, .cms-card-wrapper').forEach(el => {
            el.classList.remove('cms-media-container');
            el.classList.remove('cms-card-wrapper');
        });
    }

    function saveChanges() {
        // We will save the entire innerHTML of main sections to preserve added/removed cards
        // To be safe, disable edit mode temporarily to clean up DOM
        disableEditMode();
        
        const data = {
            hero: document.querySelector('.hero').innerHTML,
            objections: document.querySelector('.objections').innerHTML,
            how: document.querySelector('.how').innerHTML,
            social: document.querySelector('.testi-grid') ? document.querySelector('.testi-grid').innerHTML : '',
            footer: document.querySelector('footer').innerHTML
        };
        
        localStorage.setItem(STATE_KEY, JSON.stringify(data));
        
        // Re-enable edit mode
        enableEditMode();
        alert("Saved to local storage!");
    }

    function loadChanges(sourceData) {
        let data = sourceData;
        if (!data) {
            const stored = localStorage.getItem(STATE_KEY);
            if (stored) data = JSON.parse(stored);
        }
        if (data) {
            if(data.hero) document.querySelector('.hero').innerHTML = data.hero;
            if(data.objections) document.querySelector('.objections').innerHTML = data.objections;
            if(data.how) document.querySelector('.how').innerHTML = data.how;
            if(data.social && document.querySelector('.testi-grid')) document.querySelector('.testi-grid').innerHTML = data.social;
            if(data.footer) document.querySelector('footer').innerHTML = data.footer;
        }
    }

    function exportJson() {
        saveChanges();
        const data = localStorage.getItem(STATE_KEY) || "{}";
        const blob = new Blob([data], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "mra_marketing_cms_export.json";
        a.click();
    }

    function importJson(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = JSON.parse(evt.target.result);
                loadChanges(data);
                saveChanges();
                alert("Import successful! Page will reload.");
                location.reload();
            } catch(err) {
                alert("Invalid JSON");
            }
        };
        reader.readAsText(file);
    }

    function resetChanges() {
        if(confirm("Reset all changes to original?")) {
            localStorage.removeItem(STATE_KEY);
            location.reload();
        }
    }

    // Init load on page ready
    document.addEventListener("DOMContentLoaded", () => {
        loadChanges();
    });
})();

