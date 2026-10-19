import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { build } from 'esbuild';
import { compile } from 'sass';
import { chromium } from '@playwright/test';

// Execute the real layout/sidebar classes and templates with an isolated user.
// The topbar and unrelated application features are stubs; no API is contacted.
const read = file => fs.readFileSync(file, 'utf8');
const output = 'docs/quality/collapsible-sidebar';
fs.mkdirSync(output, { recursive: true });
const source = `
import 'zone.js';
import '@angular/compiler';
import { Component, inject, signal, Input, Output, EventEmitter, NO_ERRORS_SCHEMA, ɵresolveComponentResources as resolveComponentResources } from '@angular/core';
import { CommonModule } from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';
import { Router, RouterModule, provideRouter } from '@angular/router';
import { A11yModule } from '@angular/cdk/a11y';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import { of } from 'rxjs';
import { EventService } from './src/app/core/services/event.service';
import { ValidatorsService } from './src/app/services/validators.service';
import { SessionManagementService } from './src/app/core/services/session-management.service';
import { TransferReviewService } from './src/app/services/transfer-review.service';
import { SidebarPreferencesService } from './src/app/core/services/sidebar-preferences.service';
import { SidebarComponent } from './src/app/layouts/sidebar/sidebar.component';
import { VerticalComponent } from './src/app/layouts/vertical/vertical.component';
import { LayoutComponent } from './src/app/layouts/layout.component';

class TopbarStub {
  mobileMenuOpen=false; sidebarCondensed=false; isMobileViewport=false;
  mobileMenuButtonClicked=new EventEmitter();
}
Component({selector:'app-topbar',standalone:true,inputs:['mobileMenuOpen','sidebarCondensed','isMobileViewport'],outputs:['mobileMenuButtonClicked'],template:
 '<header id="page-topbar"><button id="vertical-menu-btn" type="button" [attr.aria-expanded]="isMobileViewport ? mobileMenuOpen : !sidebarCondensed" aria-controls="app-sidebar" (click)="mobileMenuButtonClicked.emit()">Menú</button><span>Sucursal de prueba · Almacén 9</span></header>'})(TopbarStub);
class SidebarHarness extends SidebarComponent {
 constructor(){super(inject(EventService),inject(Router),inject(TranslateService),inject(ValidatorsService));}
 ngOnInit(){super.ngOnInit(); const item=this.menuItems.find(i=>i.subItems?.length); if(item?.subItems?.[0]) item.subItems[0].badge={text:'3',variant:'danger'};}
}
Component({selector:'app-sidebar',standalone:true,imports:[CommonModule,RouterModule,TranslateModule,TooltipModule],template:${JSON.stringify(read('src/app/layouts/sidebar/sidebar.component.html'))},styles:[${JSON.stringify(compile('src/app/layouts/sidebar/sidebar.component.scss').css)}]})(SidebarHarness);
class VerticalHarness extends VerticalComponent {constructor(){super(inject(Router),inject(EventService));}}
Component({selector:'app-vertical',standalone:true,imports:[CommonModule,RouterModule,A11yModule,SidebarHarness,TopbarStub],schemas:[NO_ERRORS_SCHEMA],template:${JSON.stringify(read('src/app/layouts/vertical/vertical.component.html'))}})(VerticalHarness);
class Destination {}
Component({standalone:true,template:'<h1>Área de trabajo</h1><p>Contenido de prueba sin operaciones de negocio.</p>'})(Destination);
class Root extends LayoutComponent {constructor(){super(inject(Router));}}
Component({selector:'sidebar-harness',standalone:true,imports:[CommonModule,VerticalHarness],schemas:[NO_ERRORS_SCHEMA],template:${JSON.stringify(read('src/app/layouts/layout.component.html'))}})(Root);
const limited=new URLSearchParams(location.search).has('limited');
const resources=${JSON.stringify({'./layout.component.html':read('src/app/layouts/layout.component.html'),'./vertical.component.html':read('src/app/layouts/vertical/vertical.component.html'),'./sidebar.component.html':read('src/app/layouts/sidebar/sidebar.component.html'),'./sidebar.component.scss':compile('src/app/layouts/sidebar/sidebar.component.scss').css})};
resolveComponentResources(url=>Promise.resolve(resources[url]??'')).then(()=>bootstrapApplication(Root,{providers:[provideRouter([{path:'**',component:Destination,data:{data:[{title:'Prueba'}]}}]),
 {provide:ValidatorsService,useValue:{user:signal({id:101,role:limited?'OPERADOR':'ADMINISTRADOR'}),id_sucursal:signal(3),id_storage:signal(9),reload:signal(false),loadingPage:signal(false),loadingWrite:signal(false),validateUserWithPermissions:()=>true,withPermission:(name,action)=>!limited||(name==='COMPRAS'&&action==='create')}},
 {provide:TransferReviewService,useValue:{checkCurrentContext:()=>of([]),contextReady:signal(true)}},
 {provide:SessionManagementService,useValue:{startMonitoring:()=>{},stopMonitoring:()=>{}}},
 ...TranslateModule.forRoot().providers
]})).then(app=>{window.sidebarHarness=app;window.setTheme=theme=>app.components[0].instance.changeMode(theme);});
`;
const compiled = await build({ stdin: { contents: source, resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'browser', target: 'es2022', tsconfig: 'tsconfig.json', logLevel: 'silent' });
const javascript = compiled.outputFiles[0].contents;
const stylesFileName = fs.readdirSync('dist/frontend_recumet').find(f => f.startsWith('styles') && f.endsWith('.css'));
const css = read(path.join('dist/frontend_recumet', stylesFileName));
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/harness.js') { res.setHeader('Content-Type', 'application/javascript'); res.end(javascript); return; }
  if (url.pathname === '/styles.css') { res.setHeader('Content-Type', 'text/css'); res.end(css); return; }
  if (/\.(png|jpg|woff2?|ttf|svg)$/.test(url.pathname)) {
    const file = path.resolve('dist/frontend_recumet', '.' + url.pathname);
    if (file.startsWith(path.resolve('dist/frontend_recumet') + path.sep) && fs.existsSync(file)) { res.end(fs.readFileSync(file)); return; }
    res.writeHead(404); res.end(); return;
  }
  res.setHeader('Content-Type', 'text/html');
  res.end('<!doctype html><html><head><base href="/"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"></head><body><sidebar-harness></sidebar-harness><script src="/harness.js"></script></body></html>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type()==='error') errors.push(message.text()); });
const base = `http://127.0.0.1:${server.address().port}`;
const results = [];
const assert = (condition, message) => { if (!condition) throw new Error(message); };
try {
  await page.goto(base);
  await page.waitForFunction(() => Boolean(window.sidebarHarness), null, { timeout: 10000 });
  for (const theme of ['light', 'dark']) {
    for (const width of [320,375,390,768,1024,1280,1440,1920]) {
      for (const height of [568,600]) {
        await page.setViewportSize({ width, height });
        await page.evaluate(theme => window.setTheme(theme), theme);
        await page.waitForTimeout(300);
        const mobile = width < 768;
        if (mobile) {
          await page.locator('#vertical-menu-btn').click();
          await page.waitForTimeout(300);
          assert(await page.locator('body').evaluate(e=>e.classList.contains('app-sidebar-open')), 'Drawer did not open');
          await page.keyboard.press('Escape');
          await page.waitForFunction(()=>document.activeElement?.id==='vertical-menu-btn');
          assert(await page.locator('#vertical-menu-btn').evaluate(e=>e===document.activeElement), 'Escape did not restore focus');
          await page.locator('#vertical-menu-btn').click();
          await page.waitForTimeout(300);
        } else {
          if (await page.locator('.vertical-menu').evaluate(e=>e.classList.contains('is-condensed'))) await page.locator('.sidebar-toggle').click();
          await page.waitForTimeout(300);
          assert(Math.round(await page.locator('.vertical-menu').evaluate(e=>e.getBoundingClientRect().width))===260, 'Expanded width is incorrect');
          await page.locator('.sidebar-toggle').click();
          await page.waitForTimeout(300);
          assert(Math.round(await page.locator('.vertical-menu').evaluate(e=>e.getBoundingClientRect().width))===72, 'Compact width is incorrect');
          assert(await page.locator('.group-items-collapse').count()===0, 'Compact submenus must be hidden');
          assert(await page.locator('.group-count-badge').first().isVisible(), 'Compact counter is hidden');
          assert(await page.locator('.compact-label').first().isVisible(), 'Compact label is hidden');
          assert(await page.locator('.sidebar-notification-badge').first().isVisible(), 'Notification badge is hidden');
        }
        const clean = await page.evaluate(()=>document.documentElement.scrollWidth <= document.documentElement.clientWidth+1);
        assert(clean, `Document overflow at ${theme}/${width}/${height}`);
        if (height===600 && [320,768,1440].includes(width)) await page.screenshot({path:`${output}/${theme}-${width}.png`,fullPage:false});
        if (mobile) await page.locator('.sidebar-toggle').click();
        results.push({theme,width,height,passed:true});
      }
    }
  }
  await page.setViewportSize({width:1440,height:600});
  if (!(await page.locator('.vertical-menu').evaluate(e=>e.classList.contains('is-condensed')))) await page.locator('.sidebar-toggle').click();
  await page.locator('.group-header-button').first().hover();
  await page.locator('.p-tooltip-text').waitFor({state:'visible'});
  assert((await page.locator('.p-tooltip-text').innerText()).length > 0, 'Tooltip missing');
  await page.mouse.move(600,300);
  await page.reload(); await page.waitForFunction(()=>Boolean(window.sidebarHarness));
  assert(await page.locator('.vertical-menu').evaluate(e=>e.classList.contains('is-condensed')), 'Compact preference not restored after reload');
  await page.locator('.group-header-button').first().focus();
  await page.keyboard.press('Enter');
  assert(!(await page.locator('.vertical-menu').evaluate(e=>e.classList.contains('is-condensed'))), 'Group activation did not expand sidebar');
  assert(await page.locator('.group-items-collapse').count()===1, 'Selected group did not open');
  await page.locator('.group-header-button').last().click();
  const lastLink=page.locator('.group-items-collapse a').last();
  await lastLink.scrollIntoViewIfNeeded();
  const visibleInScroll = await lastLink.evaluate(e=>{const area=e.closest('.sidebar-scroll').getBoundingClientRect();const box=e.getBoundingClientRect();return box.top>=area.top-1 && box.bottom<=area.bottom+1;});
  assert(visibleInScroll,'Last navigation option is inaccessible');
  await page.setViewportSize({width:390,height:600});
  await page.locator('#vertical-menu-btn').click();
  await page.locator('.group-items-collapse a').first().click();
  assert(!(await page.locator('body').evaluate(e=>e.classList.contains('app-sidebar-open'))), 'Drawer not closed after navigation');
  assert(await page.locator('.group-header-button.has-active-route,.nav-link-item-1.active').count()>0, 'Active module indicator is missing');
  await page.goto(base+'/?limited'); await page.waitForFunction(()=>Boolean(window.sidebarHarness));
  await page.locator('#vertical-menu-btn').click();
  await page.locator('.group-header-button').first().click();
  await page.locator('.has-submenu').first().focus();
  await page.keyboard.press('Space');
  const destinations = await page.locator('.nav-link-item-2').evaluateAll(es=>es.map(e=>e.getAttribute('href')));
  assert(destinations.length===1 && destinations[0]==='/inputs/input-small', 'Unauthorized destination exposed');
  assert(errors.length===0, errors.join('\n'));
  fs.writeFileSync(`${output}/results.json`,JSON.stringify({scope:'Real Angular Layout/Vertical/Sidebar in an isolated harness, stub topbar/services; no production authentication or API flows',results,persistence:true,navigation:true,limitedPermissions:true,errors},null,2));
  console.log(`Passed ${results.length} responsive/theme cases, persistence, navigation, and limited permissions; no page errors.`);
} catch (error) { console.error(JSON.stringify({error:String(error),browserErrors:errors},null,2)); throw error; } finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }
