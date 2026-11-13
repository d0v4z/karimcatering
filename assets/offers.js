/* عروضات كريم: عدّل الأسعار هون بس.
   name = اسم الغرض · unit = الحجم/الكمية · price = السعر الجديد ($) · old = السعر القديم ($) · tag = كلمة صغيرة (اختياري) */
window.KARIM_OFFERS = {
  until: 'لحدّ آخر الأسبوع أو نفاد الكمية',
  market: [
    { name: 'زيت دوار الشمس', unit: '1.8 ليتر', price: 3.5, old: 4.25, tag: 'الأكثر طلباً' },
    { name: 'رز مصري', unit: '5 كيلو', price: 6, old: 7 },
    { name: 'سكر أبيض', unit: '2 كيلو', price: 1.75, old: 2.1 },
    { name: 'حليب بودرة', unit: '900 غرام', price: 8.9, old: 10.5 },
    { name: 'جبنة عكاوي', unit: 'كيلو', price: 5.5, old: 6.5, tag: 'طازة' },
    { name: 'معكرونة', unit: '4 × 500 غرام', price: 2, old: 2.8 }
  ],
  chicken: [
    { name: 'شيش طاووق متبّل', unit: 'كيلو', price: 6.5, old: 7.5, tag: 'عرض الاثنين' },
    { name: 'فخاد دجاج متبّلة', unit: 'كيلو', price: 4.5, old: 5.25 },
    { name: 'جوانح حارّة', unit: 'كيلو', price: 3.75, old: 4.5 },
    { name: 'دجاجة كاملة متبّلة', unit: 'جاهزة للشوي', price: 7, old: 8 }
  ]
};

/* draws the offer cards (no need to edit below) */
window.renderOffers = (el, list, waNum, waPrefix) => {
  const usd = v => '$' + (Number.isInteger(v) ? v : v.toFixed(2).replace(/0$/, ''));
  el.innerHTML = list.map((o, i) => {
    const off = o.old ? Math.round((1 - o.price / o.old) * 100) : 0;
    const msg = encodeURIComponent(waPrefix + o.name + ' (' + o.unit + ')');
    return `<a class="of rv" style="--i:${i % 2}" href="https://wa.me/961${waNum}?text=${msg}" target="_blank" rel="noopener">
      ${off > 0 ? `<span class="pc"><b class="num">-${off}%</b></span>` : ''}
      ${o.tag ? `<span class="tg">${o.tag}</span>` : ''}
      <h3>${o.name}</h3><p>${o.unit}</p>
      <div class="pr"><b class="num">${usd(o.price)}</b>${o.old ? `<s class="num">${usd(o.old)}</s>` : ''}</div>
      <span class="go">اطلب العرض</span></a>`;
  }).join('');
};
