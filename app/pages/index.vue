<template>
  <div class="flex items-center justify-center h-full">
    <!-- Hero Background -->
    <div class="hero-background">
      <div class="hero-background-image" />
    </div>

    <!-- Hero Section -->
    <div class="hero-section">
      <h1 class="gradient-hero-text">LORWYN SEASON</h1>

      <div class="flex gap-4">
        <UButton to="/submit-game" variant="solid" color="primary" size="xl" class="hero-button">
          Submit Match
        </UButton>

        <UButton to="/leaderboard" color="secondary" size="xl" class="hero-button">
          Leaderboard
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Simple hero page with two CTA buttons
</script>

<style scoped>
@reference "~/assets/css/main.css";

/* ================= HERO ================= */

.hero-background {
  @apply fixed inset-0 z-0;
}

.hero-background-image {
  @apply absolute inset-0 w-full bg-cover bg-center;
  margin: 0;
  padding: 0;
  background-image:
    linear-gradient(to bottom, transparent 0%, transparent 50%, rgba(0, 0, 0, 0.7) 100%),
    linear-gradient(to bottom, transparent 55%, #0f172a 110%),
    url("/images/elf-lorwyn.png");
}

.hero-section {
  @apply relative z-10 flex flex-col items-center justify-center px-4;
}

.gradient-hero-text {
  @apply text-transparent bg-clip-text font-black mb-12 text-5xl md:text-7xl lg:text-8xl bg-linear-to-r from-lorwyn-gold-400 to-lorwyn-gold-600;
}

/* ================= BUTTONS ================= */

.hero-button {
  @apply transition-all duration-200 hover:scale-105 hover:shadow-xl;
}
</style>
