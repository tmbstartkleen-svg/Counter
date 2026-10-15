// Pure blackjack rules functions. All returns are gross payouts, including returned stake.
// Intended for test-driven integration; online table currently supports a smaller action set.
export function handValue(cards){
 let total=0,softAces=0;
 for(const c of cards){const r=typeof c==='string'?c:c.r;
  if(r==='A'){total+=11;softAces++}
  else if(['10','J','Q','K'].includes(r))total+=10;
  else if(/^[2-9]$/.test(r))total+=Number(r);
  else throw new Error('Invalid rank');
 }
 while(total>21&&softAces){total-=10;softAces--}
 return {total,soft:softAces>0,bust:total>21,blackjack:cards.length===2&&total===21};
}
export function dealerShouldHit(cards,{hitSoft17=false}={}){
 const h=handValue(cards);return h.total<17||(h.total===17&&h.soft&&hitSoft17);
}
export function canSplit(cards,{resplitAces=false,alreadySplitAces=false}={}){
 if(cards.length!==2||alreadySplitAces&&!resplitAces)return false;
 const rank=c=>typeof c==='string'?c:c.r;
 const value=r=>['10','J','Q','K'].includes(r)?'10':r;
 return value(rank(cards[0]))===value(rank(cards[1]));
}
export function canSurrender({cards,afterHit=false,afterSplit=false,lateSurrender=true,dealerPeekComplete=true}={}){
 return !!lateSurrender&&Array.isArray(cards)&&cards.length===2&&!afterHit&&!afterSplit&&dealerPeekComplete;
}
export function settleHand({cards,dealerCards,wager,blackjackPays=1.5,surrender=false,splitHand=false}){
 if(!Number.isFinite(wager)||wager<0)throw Error('Invalid wager');
 if(surrender)return {result:'surrender',payout:wager/2,net:-wager/2};
 const p=handValue(cards),d=handValue(dealerCards);
 const natural=p.blackjack&&!splitHand, dealerNatural=d.blackjack;
 let payout=0,result='loss';
 if(p.bust){result='bust'}
 else if(natural&&!dealerNatural){payout=wager*(1+blackjackPays);result='blackjack'}
 else if(dealerNatural&&!natural){result='loss'}
 else if(p.total===d.total||natural&&dealerNatural){payout=wager;result='push'}
 else if(d.bust||p.total>d.total){payout=wager*2;result='win'}
 return {result,payout,net:payout-wager};
}
export function settleInsurance({insuranceWager,dealerCards}){
 if(!Number.isFinite(insuranceWager)||insuranceWager<0)throw Error('Invalid wager');
 const payout=handValue(dealerCards).blackjack?insuranceWager*3:0;
 return {payout,net:payout-insuranceWager};
}
