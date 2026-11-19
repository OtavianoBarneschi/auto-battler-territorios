import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame, deckRemovalStatus, removeCardFromDeck, choosePackage, chooseCard, nextRound, startPlacement, VERSION} from '../src/engine.mjs';
import cards from '../data/cards.json' with {type:'json'};
import decks from '../data/baralhos-iniciais.json' with {type:'json'};
import config from '../data/config.json' with {type:'json'};

const state=()=>createGame(cards,decks,config,()=>0);
test('V.11: uma remoção gratuita por loja e nenhuma moeda fictícia',()=>{
 assert.equal(VERSION,'V.11');
 assert.equal(config.deck_remove_cost,0);
 assert.equal(config.deck_remove_limit_per_shop,1);
 const game=state(),id=game.players[0].deck[0],initial=game.players[0].deck.length;
 assert.equal(deckRemovalStatus(game,config).available,true);
 assert.equal(removeCardFromDeck(game,id,config),true);
 assert.equal(game.players[0].deck.length,initial-1);
 assert.equal(game.players[0].removalsThisShop,1);
 assert.equal(deckRemovalStatus(game,config).available,false);
 assert.equal(removeCardFromDeck(game,game.players[0].deck[0],config),false);
 assert.equal(game.players[0].deck.length,initial-1);
 assert.equal(game.players[1].deck.length,initial);
});
test('remove somente uma cópia sem mexer na carta-base',()=>{
 const game=state(),id=game.players[0].deck[0],copies=game.players[0].deck.filter(x=>x===id).length;
 game.players[0].deck.push(id);
 const before=game.players[0].deck.length;
 assert.equal(removeCardFromDeck(game,id,config),true);
 assert.equal(game.players[0].deck.length,before-1);
 assert.equal(game.players[0].deck.filter(x=>x===id).length,copies);
 assert.ok(cards.find(c=>c.id===id));
});
test('bloqueios: carta inexistente, fase de combate, BOT, mínimo',()=>{
 const game=state(),orig=[...game.players[0].deck];
 assert.equal(removeCardFromDeck(game,'missing',config),false);
 assert.deepEqual(game.players[0].deck,orig);
 game.draftPlayer=1;
 assert.equal(removeCardFromDeck(game,orig[0],config),false);
 game.draftPlayer=0;game.phase='placement';
 assert.equal(removeCardFromDeck(game,orig[0],config),false);
 game.phase='draft';game.players[0].deck=[orig[0]];
 assert.equal(removeCardFromDeck(game,orig[0],config),false);
 assert.equal(game.players[0].deck.length,1);
});
test('remoção permanece durante a run e reabre na compra seguinte',()=>{
 const game=state();
 const id=game.players[0].deck[0];
 assert.equal(removeCardFromDeck(game,id,config),true);
 const remaining=game.players[0].deck.filter(x=>x===id).length;
 game.phase='result';assert.equal(nextRound(game,cards,config,()=>0),true);
 assert.equal(game.round,2);
 assert.equal(game.players[0].deck.filter(x=>x===id).length,remaining);
 assert.equal(game.players[0].removalsThisShop,0);
 assert.equal(deckRemovalStatus(game,config).available,true);
});
test('deck acima de 12 segue permitido; limite de campo só no backlog',()=>{
 const game=state(),id=game.players[0].deck[0];
 for(let i=0;i<7;i++)game.players[0].deck.push(id);
 assert.equal(game.players[0].deck.length,16);
 assert.equal(removeCardFromDeck(game,id,config),true);
 assert.equal(game.players[0].deck.length,15);
});
test('interface: estação disponível no pacote e na oferta, seleção e confirmação',()=>{
 const main=readFileSync(new URL('../src/main.mjs',import.meta.url),'utf8');
 const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
 for(const flag of ['shop-workbench','recycle-station','openRecycleDialog','renderRecycleDialog','data-recycle-select','data-recycle-intent','data-recycle-commit','data-recycle-inspect','recycleDialog.showModal()'])assert.ok(main.includes(flag),flag);
 assert.ok(main.includes('removeCardFromDeck(game,recycleSelectedId,config)'));
 assert.ok(css.includes('.recycle-dialog')&&css.includes('.recycle-main')&&css.includes('@media(max-width:650px)'));
 assert.ok(main.includes('impactoSvg(card)'));
});
