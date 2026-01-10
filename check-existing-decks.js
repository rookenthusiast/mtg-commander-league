const admin = require('firebase-admin');
const serviceAccount = require('./server/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkDecks() {
  console.log('🔍 Checking existing decks for Scryfall migration...\n');

  const snapshot = await db.collection('decks').get();

  console.log(`Found ${snapshot.size} decks:\n`);

  let needsMigration = 0;
  let hasDecklistText = 0;
  let hasPrices = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    const hasDecklist = !!data.decklistText;
    const hasPrice = !!data.currentPrice;
    const hasMoxfield = !!data.moxfieldUrl;

    if (hasDecklist) hasDecklistText++;
    if (hasPrice) hasPrices++;
    if (!hasDecklist && !hasPrice) needsMigration++;

    console.log(`Deck: ${data.name}`);
    console.log(`  ID: ${doc.id}`);
    console.log(`  Has decklistText: ${hasDecklist ? '✅' : '❌'}`);
    console.log(`  Has currentPrice: ${hasPrice ? `✅ (€${data.currentPrice})` : '❌'}`);
    console.log(`  Legacy moxfieldUrl: ${hasMoxfield ? '⚠️  (needs migration)' : 'none'}`);
    console.log(`  Status: ${hasDecklist && hasPrice ? '✅ Ready' : '⚠️  Needs Update'}`);
    console.log('');
  });

  console.log('\n📊 Summary:');
  console.log(`  Total decks: ${snapshot.size}`);
  console.log(`  ✅ With decklist text: ${hasDecklistText}`);
  console.log(`  ✅ With prices: ${hasPrices}`);
  console.log(`  ⚠️  Need migration: ${needsMigration}`);
  console.log('\n💡 Decks without decklistText need to be edited and have decklist pasted.');

  process.exit(0);
}

checkDecks().catch(console.error);
