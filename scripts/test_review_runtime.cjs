/* Real-input regression test using the user's existing CDP session. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {pathToFileURL}=require('url');const {chromium}=require('playwright');
(async()=>{
  const [html,cdp='http://127.0.0.1:9222',out='review-runtime-report']=process.argv.slice(2);
  if(!html)throw new Error('Provide bundled demo.html');fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.connectOverCDP(cdp),context=browser.contexts()[0],page=await context.newPage();
  const errors=[],checks={};let completed=false;page.on('pageerror',e=>errors.push(e.message));
  const check=(name,condition)=>{checks[name]=Boolean(condition);assert(condition,name);};
  try{
    await page.setViewportSize({width:1600,height:1000});await page.goto(pathToFileURL(path.resolve(html)).href);
    await page.evaluate(()=>{localStorage.removeItem('academic-review:academic-review-integration-demo')});await page.reload();
    check('default editing off',await page.locator('[contenteditable=true]').count()===0);
    await page.getByRole('button',{name:'编辑全文',exact:true}).click();
    for(const id of ['title','body','list','cell','caption']){
      await page.locator(`[data-edit-id="${id}"]`).fill('修改-'+id);
      await page.locator(`[data-edit-id="${id}"]`).fill('二次修改-'+id);
    }
    check('inline structure retained',await page.locator('strong [data-edit-id=emphasis]').count()===1);
    await page.reload();
    for(const id of ['title','body','list','cell','caption'])check('reload edit '+id,await page.locator(`[data-edit-id="${id}"]`).textContent()==='二次修改-'+id);
    const comment=async(target,text)=>{await target.click();await page.locator('.ar-editor').waitFor({state:'visible'});await page.getByRole('textbox',{name:'批注内容'}).fill(text);await page.locator('.ar-editor').getByRole('button',{name:'保存',exact:true}).click();};
    await comment(page.locator('[data-edit-id=body]'),'正文批注');
    await comment(page.locator('figure svg'),'图片批注');
    const slide=page.locator('.interactive-slide:not([hidden])'),rect=await slide.boundingBox();
    await page.mouse.click(rect.x+rect.width*.92,rect.y+rect.height*.92);
    await page.getByRole('textbox',{name:'批注内容'}).fill('空白处批注');
    let editorRect=await page.locator('.ar-editor').boundingBox();
    check('editor viewport clamped',editorRect.x>=0&&editorRect.x+editorRect.width<=1600&&editorRect.y+editorRect.height<=1000);
    await page.locator('.ar-editor').getByRole('button',{name:'保存',exact:true}).click();
    check('three anchor types saved',await page.locator('.ar-pin').count()===3);
    await page.locator('.ar-pin').first().click();check('reopen body comment',await page.getByRole('textbox',{name:'批注内容'}).inputValue()==='正文批注');
    await page.locator('.ar-editor').getByRole('button',{name:'解决',exact:true}).click();check('resolved pin',await page.locator('.ar-pin[data-status=resolved]').count()===1);
    await page.locator('.ar-editor').getByRole('button',{name:'重新打开',exact:true}).click();
    await page.locator('.ar-editor').getByRole('button',{name:'取消',exact:true}).click();
    await page.locator('figure svg').click();await page.locator('.ar-editor').getByRole('button',{name:'取消',exact:true}).click();check('cancel no extra pin',await page.locator('.ar-pin').count()===3);
    await page.getByRole('button',{name:'下一页',exact:true}).click();check('slide separation',await page.locator('.ar-pin').count()===0);
    await page.screenshot({path:path.join(out,'centered.png')});
    await page.getByRole('button',{name:'上一页',exact:true}).click();
    await page.setViewportSize({width:900,height:760});await page.locator('.ar-pin').nth(2).click();
    editorRect=await page.locator('.ar-editor').boundingBox();check('small viewport clamped',editorRect.x>=0&&editorRect.x+editorRect.width<=900&&editorRect.y+editorRect.height<=760);
    await page.screenshot({path:path.join(out,'anchored-comment-small.png')});
    await page.locator('.ar-editor').getByRole('button',{name:'取消',exact:true}).click();
    const positions=await page.evaluate(()=>{const c=review.snapshot().comments[2],s=document.querySelector('.interactive-slide:not([hidden])').getBoundingClientRect(),p=document.querySelectorAll('.ar-pin')[2].getBoundingClientRect();return {actual:[p.x+p.width/2,p.y+p.height/2],expected:[s.x+s.width*c.x,s.y+s.height*c.y]}});
    check('normalized anchor after resize',positions.actual.every((n,i)=>Math.abs(n-positions.expected[i])<2));
    await page.evaluate(()=>presentationEngine.setMode('presenter'));check('presenter hides review',!await page.locator('.ar-toolbar').isVisible()&&!await page.locator('.ar-layer').isVisible()&&await page.locator('[contenteditable=true]').count()===0);
    await page.evaluate(()=>presentationEngine.setMode('export'));check('export hides review',!await page.locator('.ar-toolbar').isVisible());await page.evaluate(()=>presentationEngine.setMode('review'));
    const download=page.waitForEvent('download');await page.getByRole('button',{name:'导出修改后 HTML',exact:true}).click();const downloaded=await download;const revised=path.join(out,'reopened.html');await downloaded.saveAs(revised);
    await page.evaluate(()=>localStorage.removeItem('academic-review:academic-review-integration-demo'));await page.goto(pathToFileURL(path.resolve(revised)).href);
    check('export embedded comments',await page.locator('.ar-pin').count()===3);check('export embedded edits',await page.locator('[data-edit-id=body]').textContent()==='二次修改-body');
    await page.locator('.ar-pin').last().click();await page.locator('.ar-editor').getByRole('button',{name:'删除',exact:true}).click();check('delete comment',await page.locator('.ar-pin').count()===2);
    await page.setViewportSize({width:1600,height:1000});await page.screenshot({path:path.join(out,'review-full.png')});
    check('no browser errors',errors.length===0);
    completed=true;
  }finally{
    const report={checks,errors,passed:completed&&errors.length===0&&Object.values(checks).every(Boolean),checkedAt:new Date().toISOString()};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await page.close();await browser.close();
  }
})().catch(e=>{console.error(e.stack);process.exitCode=1});
