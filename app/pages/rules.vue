<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <h1 class="text-2xl font-bold">League Rules</h1>
      </template>

      <div class="prose dark:prose-invert max-w-none">
        <h2>Budget Commander League Rules</h2>

        <h3>1. Deck Construction</h3>
        <ul>
          <li><strong>Budget Limit:</strong> All decks must stay within the designated budget (e.g., $50, $100)</li>
          <li><strong>Commander Format:</strong> Standard Commander rules apply (100 cards, 1 commander)</li>
          <li><strong>Price Tracking:</strong> Use TCGPlayer market price at time of deck registration</li>
          <li><strong>Basic Lands:</strong> Do not count toward budget</li>
        </ul>

        <h3>2. Scoring System</h3>
        <ul>
          <li><strong>Win:</strong> 3 points</li>
          <li><strong>Second Place:</strong> 2 points (in 4-player pods)</li>
          <li><strong>Third Place:</strong> 1 point (in 4-player pods)</li>
          <li><strong>Participation:</strong> 1 point for playing</li>
        </ul>

        <h3>3. Game Rules</h3>
        <ul>
          <li>Standard Commander rules apply</li>
          <li>20-minute mulligan rule</li>
          <li>Games should be completed within 2 hours</li>
          <li>Encouraged to track game stats for league analytics</li>
        </ul>

        <h3>4. Banned Cards (League-Specific)</h3>
        <p>In addition to the standard Commander banned list:</p>
        <ul>
          <li>Additional league-specific bans may be added based on community vote</li>
          <li>Check the official Commander banned list at:
            <a href="https://mtgcommander.net/index.php/banned-list/" target="_blank">
              mtgcommander.net
            </a>
          </li>
        </ul>

        <h3>5. Deck Updates</h3>
        <ul>
          <li>Decks can be updated between seasons</li>
          <li>Must stay within budget restrictions</li>
          <li>Major changes require re-registration</li>
        </ul>

        <h3>6. Sportsmanship</h3>
        <ul>
          <li>Be respectful to all players</li>
          <li>No kingmaking or collusion</li>
          <li>Communicate clearly about triggers and game state</li>
          <li>Have fun!</li>
        </ul>

        <h3>7. Prizes & Seasons</h3>
        <ul>
          <li>Seasons run for 3 months</li>
          <li>Top 3 players receive recognition and prizes</li>
          <li>Prizes determined by league organizer</li>
        </ul>

        <div class="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 class="text-lg font-semibold mb-2">Questions?</h4>
          <p>
            Contact the league organizer or discuss in the community Discord/chat.
          </p>
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-xl font-bold">Quick Reference</h2>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 class="font-semibold mb-2">Starting Life</h3>
          <p class="text-2xl font-bold text-primary">40</p>
        </div>

        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 class="font-semibold mb-2">Commander Damage</h3>
          <p class="text-2xl font-bold text-primary">21</p>
        </div>

        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 class="font-semibold mb-2">Deck Size</h3>
          <p class="text-2xl font-bold text-primary">100</p>
        </div>

        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 class="font-semibold mb-2">Max Copies</h3>
          <p class="text-2xl font-bold text-primary">1</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">(Except basic lands)</p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
// Static rules page - could be made editable by admins in the future
</script>

<style scoped>
.prose a {
  color: rgb(var(--color-primary-500));
  text-decoration: underline;
}
</style>
