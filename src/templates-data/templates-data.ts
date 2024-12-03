import type { Diagram } from '@/lib/domain/diagram';
import { employeeDb } from './templates/employee-db';
import { visualNovelDb } from './templates/visual-novel-db';
import { airbnbDb } from './templates/airbnb-db';
import { wordpressDb } from './templates/wordpress-db';
import { pokemonDb } from './templates/pokemon-db';
import { adonisAclDb } from './templates/adonis-acl-db';
import { akauntingDb } from './templates/akaunting-db';
import { djangoDb } from './templates/django-db';
import { twitterDb } from './templates/twitter-db';
import { laravelDb } from './templates/laravel-db';
import { laravelSparkDb } from './templates/laravel-spark-db';
import { voyagerDb } from './templates/voyager-db';
import { koelDb } from './templates/koel-db';
import { laravelPermissionDb } from './templates/laravel-permission-db';
import { gravityDb } from './templates/gravity-db';
import { ticketitDb } from './templates/ticketit-db';
import { lobstersDb } from './templates/lobsters-db';
import { refinerycmsDb } from './templates/refinerycms-db';
import { buddypressDb } from './templates/buddypress-db';
import { snipeItDb } from './templates/snipe-it-db';
import { comfortableMexicanSofaDb } from './templates/comfortable-mexican-sofa-db';
import { syliusDb } from './templates/sylius-db';
import { monicaDb } from './templates/monica-db';
import { attendizeDb } from './templates/attendize-db';
import { saasPegasusDb } from './templates/saas-pegasus-db';
import { bookstackDb } from './templates/bookstack-db';
import { bouncerDb } from './templates/bouncer-db';
import { cabotDb } from './templates/cabot-db';
import { feedbinDb } from './templates/feedbin-db';
import { freescoutDb } from './templates/freescout-db';
import { hackerNewsDb } from './templates/hacker-news-db';
import { flarumDb } from './templates/flarum-db';
import { canvasDb } from './templates/canvas-db';
import { taggitDb } from './templates/taggit-db';
import { doorkeeperDb } from './templates/doorkeeper-db';
import { orchidDb } from './templates/orchid-db';
import { flipperDb } from './templates/flipper-db';
import { cachetDb } from './templates/cachet-db';
import { reversionDb } from './templates/reversion-db';
import { screeenlyDb } from './templates/screeenly-db';
import { staytusDb } from './templates/staytus-db';
import { deployerDb } from './templates/deployer-db';
import { deviseDb } from './templates/devise-db';
import { talkDb } from './templates/talk-db';
import { octoboxDb } from './templates/octobox-db';
import { payRailsDb } from './templates/pay-rails-db';
import { laravelActivitylogDb } from './templates/laravel-activitylog-db';
import { pixelfedDb } from './templates/pixelfed-db';
import { polrDb } from './templates/polr-db';
import { djangoAxesDb } from './templates/django-axes-db';
export interface Template {
    slug: string;
    name: string;
    shortDescription: string;
    description: string;
    image: string;
    imageDark: string;
    diagram: Diagram;
    tags: string[];
    featured: boolean;
    url?: string;
}

export const templates: Template[] = [
    employeeDb,
    pokemonDb,
    airbnbDb,
    wordpressDb,
    djangoDb,
    laravelDb,
    twitterDb,
    visualNovelDb,
    adonisAclDb,
    akauntingDb,
    laravelSparkDb,
    voyagerDb,
    koelDb,
    laravelPermissionDb,
    gravityDb,
    ticketitDb,
    lobstersDb,
    refinerycmsDb,
    buddypressDb,
    snipeItDb,
    comfortableMexicanSofaDb,
    syliusDb,
    monicaDb,
    attendizeDb,
    saasPegasusDb,
    bookstackDb,
    bouncerDb,
    cabotDb,
    feedbinDb,
    freescoutDb,
    hackerNewsDb,
    flarumDb,
    canvasDb,
    taggitDb,
    doorkeeperDb,
    orchidDb,
    flipperDb,
    cachetDb,
    reversionDb,
    screeenlyDb,
    staytusDb,
    deployerDb,
    deviseDb,
    talkDb,
    octoboxDb,
    payRailsDb,
    laravelActivitylogDb,
    pixelfedDb,
    polrDb,
    djangoAxesDb,
];
