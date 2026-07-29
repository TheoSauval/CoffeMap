import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors, fonts, radius, spacing } from '@/constants/theme';
import { RECIPE_IDEAS, type RecipeIdea } from '@/constants/recipeIdeas';
import { useRecipes } from '@/lib/recipes';
import type { Recipe } from '@/types/recipe';

// DA dédiée à cet onglet : fond bleu franc, cartes blanches — distinct du reste de l'app.
export const blue = {
  primary: '#364BAD',
  primaryDark: '#293982',
  ink: '#293982',
  inkSoft: '#5C6BC9',
  card: '#FFFFFF',
  overlay: 'rgba(255,255,255,0.14)',
  overlayStrong: 'rgba(255,255,255,0.22)',
  white: '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.7)',
};

// Le temps de chargement d'entrée sur l'onglet — laisse la place à un SVG animé plus tard.
const LOADING_DURATION_MS = 900;
const WIPE_DURATION_MS = 380;

export const tabBarStyle = {
  backgroundColor: blue.primary,
  borderTopColor: blue.primaryDark,
  height: 88,
  paddingTop: 8,
};

const hiddenTabBarStyle = { display: 'none' as const };

type Mode = 'closed' | 'create' | 'import';

export default function MyCafeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { recipes, addRecipe, removeRecipe } = useRecipes();
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('closed');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [url, setUrl] = useState('');
  const [selectedIdea, setSelectedIdea] = useState<RecipeIdea | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const wipeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      StatusBar.setStyle('light');
      navigation.setOptions({ tabBarStyle: hiddenTabBarStyle });

      wipeAnim.setValue(0);
      Animated.timing(wipeAnim, {
        toValue: 1,
        duration: WIPE_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        setLoading(false);
        navigation.setOptions({ tabBarStyle });
      }, LOADING_DURATION_MS);

      return () => {
        clearTimeout(timer);
        StatusBar.setStyle('dark');
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigation])
  );

  const wipeTranslate = wipeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [width, 0],
  });

  const resetForm = () => {
    setMode('closed');
    setTitle('');
    setNotes('');
    setUrl('');
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    addRecipe({
      title: title.trim(),
      notes: notes.trim(),
      sourceUrl: mode === 'import' && url.trim() ? url.trim() : null,
    });
    resetForm();
  };

  const handleAddIdea = (idea: RecipeIdea) => {
    addRecipe({ title: idea.title, notes: idea.notes, sourceUrl: null });
    setSelectedIdea(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <Animated.View
          style={[styles.wipeLayer, { transform: [{ translateX: wipeTranslate }] }]}
        />
        <View style={styles.loadingContent} pointerEvents="none">
          {/* TODO: remplacer par un SVG animé */}
          <ActivityIndicator size="large" color={blue.white} />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Mon café</Text>
            <Text style={styles.subtitle}>Tes recettes maison, à faire ou à importer</Text>

            <Text style={[styles.sectionTitle, styles.ideaSectionTitle]}>Idées à essayer</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.ideaRow}
            >
              {RECIPE_IDEAS.map((idea) => (
                <Pressable
                  key={idea.title}
                  style={styles.ideaCard}
                  onPress={() => setSelectedIdea(idea)}
                >
                  <View style={styles.ideaIcon}>
                    <Ionicons name={idea.icon} size={22} color={blue.primary} />
                  </View>
                  <Text style={styles.ideaTitle} numberOfLines={1}>
                    {idea.title}
                  </Text>
                  <Text style={styles.ideaTagline} numberOfLines={2}>
                    {idea.tagline}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.actionButton, mode === 'create' && styles.actionButtonActive]}
                onPress={() => setMode(mode === 'create' ? 'closed' : 'create')}
              >
                <Ionicons
                  name="add"
                  size={16}
                  color={mode === 'create' ? blue.primary : blue.white}
                />
                <Text style={[styles.actionText, mode === 'create' && styles.actionTextActive]}>
                  Créer une recette
                </Text>
              </Pressable>
              <Pressable
                style={[styles.actionButton, mode === 'import' && styles.actionButtonActive]}
                onPress={() => setMode(mode === 'import' ? 'closed' : 'import')}
              >
                <Ionicons
                  name="link"
                  size={16}
                  color={mode === 'import' ? blue.primary : blue.white}
                />
                <Text style={[styles.actionText, mode === 'import' && styles.actionTextActive]}>
                  Importer un lien
                </Text>
              </Pressable>
            </View>

            {mode !== 'closed' && (
              <View style={styles.form}>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Nom de la recette"
                  placeholderTextColor={blue.inkSoft}
                  style={styles.input}
                />
                {mode === 'import' && (
                  <TextInput
                    value={url}
                    onChangeText={setUrl}
                    placeholder="Lien à importer (URL)"
                    placeholderTextColor={blue.inkSoft}
                    style={styles.input}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                )}
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={mode === 'import' ? 'Notes (optionnel)' : 'Étapes / ingrédients'}
                  placeholderTextColor={blue.inkSoft}
                  style={[styles.input, styles.inputMultiline]}
                  multiline
                />
                <Pressable
                  style={[styles.submitButton, !title.trim() && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={!title.trim()}
                >
                  <Text style={styles.submitText}>Ajouter</Text>
                </Pressable>
              </View>
            )}

            {recipes.length > 0 && <Text style={styles.sectionTitle}>Tes recettes</Text>}
          </View>
        }
        ListEmptyComponent={
          mode === 'closed' ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="cafe-outline" size={32} color={blue.white} />
              </View>
              <Text style={styles.emptyTitle}>Aucune recette pour l'instant</Text>
              <Text style={styles.emptyText}>
                Crée ta propre recette de café maison ou importe-en une depuis un lien.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            onRemove={() => removeRecipe(item.id)}
            onPress={() => setSelectedRecipe(item)}
          />
        )}
      />

      <Modal
        visible={selectedIdea !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedIdea(null)}
      >
        <Pressable style={styles.modalRoot} onPress={() => setSelectedIdea(null)}>
          <View style={[styles.modalBlob, styles.modalBlobOne]} pointerEvents="none" />
          <View style={[styles.modalBlob, styles.modalBlobTwo]} pointerEvents="none" />

          <View style={[styles.modalCloseRow, { paddingTop: insets.top + spacing.sm }]}>
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setSelectedIdea(null)}
              hitSlop={10}
            >
              <Ionicons name="close" size={20} color={blue.white} />
            </Pressable>
          </View>

          {selectedIdea && (
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.modalScrollContent,
                  { paddingBottom: insets.bottom + spacing.xl },
                ]}
              >
                <Text style={styles.modalPosterTitle}>{selectedIdea.title}</Text>

                <View style={styles.modalIllustration}>
                  <Ionicons name={selectedIdea.icon} size={100} color="#F2ECDD" />
                </View>

                <Text style={styles.modalTagline}>{selectedIdea.tagline}</Text>

                <Text style={styles.modalSectionLabel}>Préparation</Text>
                <Text style={styles.modalNotes}>{selectedIdea.notes}</Text>

                <Pressable style={styles.modalAddButton} onPress={() => handleAddIdea(selectedIdea)}>
                  <Text style={styles.modalAddText}>Ajouter à mes recettes</Text>
                </Pressable>
                <Text style={styles.modalFooter}>coffeemap · recette maison</Text>
              </ScrollView>
            </Pressable>
          )}
        </Pressable>
      </Modal>

      <Modal
        visible={selectedRecipe !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedRecipe(null)}
      >
        <Pressable style={styles.ticketBackdrop} onPress={() => setSelectedRecipe(null)}>
          {selectedRecipe && (
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.ticketCard}>
                <View style={styles.ticketNotchLeft} />
                <View style={styles.ticketNotchRight} />

                <Ionicons name="cafe" size={22} color={blue.primary} />
                <Text style={styles.ticketBrand}>Coffeemap</Text>
                <Text style={styles.ticketTitle}>{selectedRecipe.title}</Text>

                <View style={styles.ticketDivider} />

                {selectedRecipe.notes.length > 0 && (
                  <Text style={styles.ticketNotes}>{selectedRecipe.notes}</Text>
                )}

                {selectedRecipe.sourceUrl && (
                  <>
                    <View style={styles.ticketDivider} />
                    <Pressable onPress={() => Linking.openURL(selectedRecipe.sourceUrl!)}>
                      <Text style={styles.ticketLink}>Voir la recette ↗</Text>
                    </Pressable>
                  </>
                )}

                <View style={styles.ticketDivider} />
                <Text style={styles.ticketDate}>
                  Ajoutée le {new Date(selectedRecipe.createdAt).toLocaleDateString('fr-FR')}
                </Text>

                <View style={styles.ticketZigzagRow}>
                  {Array.from({ length: 16 }).map((_, i) => (
                    <View key={i} style={styles.ticketZigzagTooth} />
                  ))}
                </View>
              </View>

              <Pressable
                style={styles.ticketDeleteButton}
                onPress={() => {
                  removeRecipe(selectedRecipe.id);
                  setSelectedRecipe(null);
                }}
              >
                <Ionicons name="trash-outline" size={16} color={blue.white} />
                <Text style={styles.ticketDeleteText}>Supprimer cette recette</Text>
              </Pressable>
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function RecipeCard({
  recipe,
  onRemove,
  onPress,
}: {
  recipe: Recipe;
  onRemove: () => void;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {recipe.title}
        </Text>
        <Pressable onPress={onRemove} hitSlop={8}>
          <Ionicons name="close" size={18} color={blue.inkSoft} />
        </Pressable>
      </View>

      {recipe.notes.length > 0 && (
        <Text style={styles.cardNotes} numberOfLines={1}>
          {recipe.notes.replace(/\n/g, ' ')}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: blue.primary,
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: colors.cream,
    overflow: 'hidden',
  },
  wipeLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: blue.primary,
  },
  loadingContent: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 34,
    color: blue.white,
    marginTop: spacing.md,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: blue.whiteSoft,
    marginTop: 4,
  },
  ideaSectionTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  ideaRow: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  ideaCard: {
    width: 140,
    backgroundColor: blue.overlay,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  ideaIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: blue.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  ideaTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: blue.white,
  },
  ideaTagline: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: blue.whiteSoft,
    marginTop: 2,
    lineHeight: 15,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: blue.overlay,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  actionButtonActive: {
    backgroundColor: blue.white,
  },
  actionText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: blue.white,
  },
  actionTextActive: {
    color: blue.primary,
  },
  form: {
    marginTop: spacing.md,
    backgroundColor: blue.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: blue.ink,
    backgroundColor: '#EEF0FC',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  inputMultiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: blue.primary,
    borderRadius: radius.pill,
    paddingVertical: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: blue.white,
  },
  sectionTitle: {
    fontFamily: fonts.accentBold,
    fontSize: 16,
    color: blue.white,
    marginTop: spacing.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: blue.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: blue.white,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: blue.whiteSoft,
    textAlign: 'center',
    lineHeight: 19,
  },
  card: {
    backgroundColor: blue.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontFamily: fonts.accentBold,
    fontSize: 17,
    color: blue.ink,
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  cardNotes: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: blue.inkSoft,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  // Poster plein bleu, typo géante façon affiche de menu — pas de carte imbriquée.
  modalRoot: {
    flex: 1,
    backgroundColor: blue.primary,
    overflow: 'hidden',
  },
  modalBlob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  modalBlobOne: {
    width: 280,
    height: 280,
    top: -70,
    right: -80,
  },
  modalBlobTwo: {
    width: 200,
    height: 200,
    bottom: -50,
    left: -60,
  },
  modalCloseRow: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  modalScrollContent: {
    flexGrow: 1,
    paddingTop: spacing.lg,
  },
  modalPosterTitle: {
    fontFamily: fonts.display,
    fontSize: 44,
    lineHeight: 54,
    paddingTop: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: '#F2ECDD',
  },
  modalIllustration: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
  },
  modalTagline: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: 'rgba(242,236,221,0.75)',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  modalSectionLabel: {
    fontFamily: fonts.accentBold,
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#F2ECDD',
    marginBottom: spacing.xs,
  },
  modalNotes: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(242,236,221,0.9)',
    marginBottom: spacing.xl,
  },
  modalAddButton: {
    backgroundColor: '#F2ECDD',
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalAddText: {
    fontFamily: fonts.accentBold,
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: blue.primary,
  },
  modalFooter: {
    fontFamily: fonts.accentBold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    color: 'rgba(242,236,221,0.5)',
  },
  // Popup "ticket de caisse" pour une recette enregistrée.
  ticketBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,24,64,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  ticketCard: {
    width: 300,
    backgroundColor: '#FAF6EC',
    borderRadius: 10,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    alignItems: 'center',
    overflow: 'hidden',
  },
  ticketNotchLeft: {
    position: 'absolute',
    left: -10,
    top: '46%',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(20,24,64,0.6)',
  },
  ticketNotchRight: {
    position: 'absolute',
    right: -10,
    top: '46%',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(20,24,64,0.6)',
  },
  ticketBrand: {
    fontFamily: fonts.accentBold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: blue.primary,
    marginTop: 4,
  },
  ticketTitle: {
    fontFamily: fonts.accentBold,
    fontSize: 20,
    color: blue.ink,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  ticketDivider: {
    alignSelf: 'stretch',
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(41,57,130,0.25)',
    marginVertical: spacing.md,
  },
  ticketNotes: {
    alignSelf: 'stretch',
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0.3,
    color: blue.ink,
  },
  ticketLink: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: blue.primary,
  },
  ticketDate: {
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 0.5,
    color: blue.inkSoft,
  },
  ticketZigzagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginHorizontal: -spacing.lg,
    marginBottom: -10,
  },
  ticketZigzagTooth: {
    width: 12,
    height: 12,
    backgroundColor: 'rgba(20,24,64,0.6)',
    transform: [{ rotate: '45deg' }],
  },
  ticketDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  ticketDeleteText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: blue.white,
  },
});
