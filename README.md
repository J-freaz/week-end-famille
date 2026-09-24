# À table — week-end en famille

Projet personnel indépendant pour organiser les repas et les courses du week-end du 24 au 26 octobre 2026.

## Utilisation

1. Choisir son prénom dans « Je suis », ou créer un profil simple sans mot de passe.
2. Renseigner ses quantités pour l’ensemble du week-end dans « Mes quantités », avec son choix de garniture pour les pizzas. Deux personnes partageant une pizza indiquent chacune 0,5 avec le même choix.
3. Pour un proche, créer ou sélectionner son profil dans « Je renseigne pour », en gardant son propre prénom dans « Je suis ».
4. Consulter « Récap par personne » pour voir les demandes et qui les a renseignées.
5. La personne qui fait tous les achats utilise « Courses » : les demandes sont additionnées par article et par choix (par exemple chèvre / quatre fromages), avec les prénoms correspondants. Les achats peuvent être cochés.

Une quantité non renseignée reste en attente. Une saisie de zéro est une réponse explicite. Une correction remplace la quantité précédente pour la même personne et le même article. Les estimations initiales pour 10 personnes servent de repères et ne sont pas ajoutées aux demandes individuelles.

## Profils et droits

Les prénoms sont des profils déclaratifs, pas des identités vérifiées : chacun peut sélectionner un profil ou saisir pour un proche. Le récapitulatif conserve séparément le bénéficiaire et le prénom utilisé pour la saisie. Le navigateur mémorise seulement le profil sélectionné sur cet appareil.

Seul le compte organisateur connecté peut ajouter ou supprimer un article, modifier son nom ou son rayon, et changer les menus. Ces autorisations sont contrôlées par le serveur. L’accès organisateur se trouve en bas de page. Aucun secret de connexion ne figure dans ce dépôt.

## Sauvegarde

Les profils, quantités, achats et repas sont enregistrés dans un service consacré à ce projet. La page récupère les mises à jour toutes les cinq secondes lorsqu’elle est visible. Les conflits entre deux saisies sont signalés. Une erreur de connexion conserve le formulaire pour permettre de réessayer.

Les quantités utilisent une unité fixe par article. Les sommes sont calculées en milli-unités entières pour éviter les erreurs d’arrondi. Les conditionnements disponibles en magasin restent à vérifier par la personne qui fait les courses.

L’accès familial est ouvert à toute personne disposant du lien. Les profils, choix et quantités sont visibles et modifiables sans connexion ; seul l’espace organisateur exige une connexion au compte du propriétaire.

## Repas et confidentialité

Les menus, les présences, les quantités et les besoins alimentaires restent à confirmer. Modifier un menu ne remplace pas automatiquement ses ingrédients. Aucune conversation privée ni export original ne fait partie du site. Le projet et sa sauvegarde sont indépendants de tout projet professionnel.

## Hébergement

Interface GitHub Pages : branche `main`, dossier racine. Adresse conservée : https://j-freaz.github.io/week-end-famille/.

La sauvegarde et l’espace organisateur utilisent Sites, avec des sources et migrations dans le projet personnel dédié.

Les choix existants sont proposés pendant la saisie ; chacun peut préciser une autre préférence sans créer d’article. L’organisateur décide quels articles exigent un choix. Une modification de choix remplace la précédente et remet l’achat à vérifier.

## Gestion des repas

Dans l’espace organisateur, ouvrir « Repas » puis « + Ajouter un plat » sous le repas concerné. Un nouveau plat crée aussi un article dans « Mes quantités » et « Courses », avec l’unité et le rayon choisis. Un article existant peut être réutilisé à plusieurs repas sans doubler ses quantités, qui couvrent toujours tout le week-end.

Chaque plat peut être renommé ou retiré du menu. Retirer un plat d’un repas conserve l’article et les quantités déjà saisies ; supprimer l’article des courses reste une action distincte de l’organisateur. Les nouveaux plats à préparer ne calculent pas automatiquement leurs ingrédients.

## Apéro à partager

Une rubrique commune pour tout le week-end propose chips, biscuits apéritifs, olives, saucisson, dés de fromage, tomates cerises, houmous, jus de fruits, sodas et eau pétillante. Chacun indique sa part dans « Mes quantités » : grammes pour les aliments, litres pour les boissons (25 cl = 0,25 L), zéro s’il n’en souhaite pas. Les totaux s’ajoutent aux courses par rayon. L’organisateur peut modifier, retirer ou ajouter des propositions. Aucune quantité n’est préremplie au nom de la famille.

## Son de validation

Une quantité sauvegardée déclenche le fichier MP3 fourni par l’organisateur le 24 septembre 2026, conservé intégralement sans réencodage ni découpage. Le bouton « Son activé / Son coupé » mémorise le choix dans ce navigateur. « Tester Dracarys » permet de l’écouter sans modifier la liste. Aucun son au chargement ou après une erreur ; la sauvegarde reste utilisable si le navigateur bloque l’audio.
