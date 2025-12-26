/**
 * Composable for interacting with the Scryfall API
 * Documentation: https://scryfall.com/docs/api
 */

interface ScryfallCard {
  id: string;
  name: string;
  image_uris?: {
    small: string;
    normal: string;
    large: string;
    png: string;
    art_crop: string;
    border_crop: string;
  };
  card_faces?: Array<{
    image_uris?: {
      small: string;
      normal: string;
      large: string;
      png: string;
      art_crop: string;
      border_crop: string;
    };
  }>;
}

export const useScryfall = () => {
  const BASE_URL = "https://api.scryfall.com";

  /**
   * Fetch a card by name from Scryfall
   * Uses fuzzy matching to find the best match
   */
  const fetchCardByName = async (
    cardName: string
  ): Promise<ScryfallCard | null> => {
    if (!cardName || cardName.trim() === "") {
      return null;
    }

    try {
      const response = await fetch(
        `${BASE_URL}/cards/named?fuzzy=${encodeURIComponent(cardName)}`
      );

      if (!response.ok) {
        console.error(`Scryfall API error for "${cardName}":`, response.status);
        return null;
      }

      const card: ScryfallCard = await response.json();
      return card;
    } catch (error) {
      console.error(`Error fetching card "${cardName}":`, error);
      return null;
    }
  };

  /**
   * Get the image URL for a card
   * Prefers art_crop for clean artwork, falls back to normal
   */
  const getCardImageUrl = (
    card: ScryfallCard | null,
    size: "small" | "normal" | "large" | "art_crop" = "art_crop"
  ): string | null => {
    if (!card) return null;

    // Check for single-faced card image
    if (card.image_uris) {
      return (
        card.image_uris[size] ||
        card.image_uris.art_crop ||
        card.image_uris.normal
      );
    }

    // Check for double-faced card (use front face)
    if (card.card_faces && card.card_faces[0]?.image_uris) {
      return (
        card.card_faces[0].image_uris[size] ||
        card.card_faces[0].image_uris.art_crop ||
        card.card_faces[0].image_uris.normal
      );
    }

    return null;
  };

  /**
   * Fetch and return just the image URL for a commander
   */
  const fetchCommanderImage = async (
    commanderName: string
  ): Promise<string | null> => {
    const card = await fetchCardByName(commanderName);
    return getCardImageUrl(card);
  };

  /**
   * Search for legendary creatures (potential commanders)
   * Returns a list of card names for autocomplete
   */
  const searchCommanders = async (
    query: string
  ): Promise<Array<{ label: string; value: string }>> => {
    console.log(`Searching commanders for query: "${query}"`);
    if (!query || query.trim().length < 3) {
      return [];
    }

    try {
      // Use autocomplete endpoint for better name matching (case-insensitive)
      const response = await fetch(
        `${BASE_URL}/cards/autocomplete?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        console.error(`Scryfall autocomplete error:`, response.status);
        return [];
      }

      const data = await response.json();

      // Get the card names from autocomplete, then filter for legendary creatures
      // We need to make a second request to get full card data
      const cardNames = data.data || [];

      // For autocomplete, we'll return all results and let the user choose
      // Then verify if it's a valid commander when they submit
      return cardNames.slice(0, 10).map((name: string) => ({
        label: name,
        value: name,
      }));
    } catch (error) {
      console.error(`Error searching commanders:`, error);
      return [];
    }
  };

  return {
    fetchCardByName,
    getCardImageUrl,
    fetchCommanderImage,
    searchCommanders,
  };
};
