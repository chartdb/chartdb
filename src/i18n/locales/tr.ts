import type { LanguageMetadata, LanguageTranslation } from '../types';

export const tr: LanguageTranslation = {
    translation: {
        menu: {
            file: {
                file: 'Dosya',
                new: 'Yeni',
                open: 'Aç',
                save: 'Kaydet',
                import: 'Veritabanı İçe Aktar',
                export_sql: 'SQL Olarak Dışa Aktar',
                export_as: 'Olarak Dışa Aktar',
                delete_diagram: 'Diyagramı Sil',
                exit: 'Çıkış',
            },
            edit: {
                edit: 'Düzenle',
                undo: 'Geri Al',
                redo: 'Yinele',
                clear: 'Temizle',
            },
            view: {
                view: 'Görünüm',
                show_sidebar: 'Kenar Çubuğunu Göster',
                hide_sidebar: 'Kenar Çubuğunu Gizle',
                hide_cardinality: 'Kardinaliteyi Gizle',
                show_cardinality: 'Kardinaliteyi Göster',
                zoom_on_scroll: 'Kaydırarak Yakınlaştır',
                theme: 'Tema',
                show_dependencies: 'Bağımlılıkları Göster',
                hide_dependencies: 'Bağımlılıkları Gizle',
                // TODO: Translate
                show_minimap: 'Show Mini Map',
                hide_minimap: 'Hide Mini Map',
            },
            // TODO: Translate
            backup: {
                backup: 'Backup',
                export_diagram: 'Export Diagram',
                restore_diagram: 'Restore Diagram',
            },
            help: {
                help: 'Yardım',
                docs_website: 'Belgeleme',
                join_discord: "Discord'a Katıl",
            },
        },

        delete_diagram_alert: {
            title: 'Diyagramı Sil',
            description:
                'Bu işlem geri alınamaz. Diyagram kalıcı olarak silinecektir.',
            cancel: 'İptal',
            delete: 'Sil',
        },

        clear_diagram_alert: {
            title: 'Diyagramı Temizle',
            description:
                'Bu işlem geri alınamaz. Diyagramdaki tüm veriler kalıcı olarak silinecektir.',
            cancel: 'İptal',
            clear: 'Temizle',
        },

        reorder_diagram_alert: {
            title: 'Diyagramı Yeniden Sırala',
            description:
                'Bu işlem tüm tabloları yeniden düzenleyecektir. Devam etmek istiyor musunuz?',
            reorder: 'Yeniden Sırala',
            cancel: 'İptal',
        },

        multiple_schemas_alert: {
            title: 'Birden Fazla Şema',
            description:
                'Bu diyagramda {{schemasCount}} şema var. Şu anda görüntülenen: {{formattedSchemas}}.',
            dont_show_again: 'Tekrar gösterme',
            change_schema: 'Değiştir',
            none: 'yok',
        },

        copy_to_clipboard_toast: {
            unsupported: {
                title: 'Kopyalama başarısız',
                description: 'Panoya desteklenmiyor',
            },
            failed: {
                title: 'Kopyalama başarısız',
                description: 'Bir şeyler ters gitti. Lütfen tekrar deneyin.',
            },
        },

        theme: {
            system: 'Sistem',
            light: 'Açık',
            dark: 'Koyu',
        },

        zoom: {
            on: 'Açık',
            off: 'Kapalı',
        },

        last_saved: 'Son kaydedilen',
        saved: 'Kaydedildi',
        loading_diagram: 'Diyagram yükleniyor...',
        deselect_all: 'Hepsini Seçme',
        select_all: 'Hepsini Seç',
        clear: 'Temizle',
        show_more: 'Daha Fazla Göster',
        show_less: 'Daha Az Göster',
        copy_to_clipboard: 'Panoya Kopyala',
        copied: 'Kopyalandı!',
        side_panel: {
            schema: 'Şema:',
            filter_by_schema: 'Şemaya Göre Filtrele',
            search_schema: 'Şema ara...',
            no_schemas_found: 'Şema bulunamadı.',
            view_all_options: 'Tüm Seçenekleri Gör...',
            tables_section: {
                tables: 'Tablolar',
                add_table: 'Tablo Ekle',
                filter: 'Filtrele',
                collapse: 'Hepsini Daralt',
                // TODO: Translate
                clear: 'Clear Filter',
                no_results: 'No tables found matching your filter.',
                // TODO: Translate
                show_list: 'Show Table List',
                show_dbml: 'Show DBML Editor',

                table: {
                    fields: 'Alanlar',
                    nullable: 'Boş Bırakılabilir?',
                    primary_key: 'Birincil Anahtar',
                    indexes: 'İndeksler',
                    comments: 'Yorumlar',
                    no_comments: 'Yorum yok',
                    add_field: 'Alan Ekle',
                    add_index: 'İndeks Ekle',
                    index_select_fields: 'Alanları Seç',
                    no_types_found: 'Tür bulunamadı',
                    field_name: 'Ad',
                    field_type: 'Tür',
                    field_actions: {
                        title: 'Alan Özellikleri',
                        unique: 'Tekil',
                        comments: 'Yorumlar',
                        no_comments: 'Yorum yok',
                        delete_field: 'Alanı Sil',
                        // TODO: Translate
                        character_length: 'Max Length',
                    },
                    index_actions: {
                        title: 'İndeks Özellikleri',
                        name: 'Ad',
                        unique: 'Tekil',
                        delete_index: 'İndeksi Sil',
                    },
                    table_actions: {
                        title: 'Tablo İşlemleri',
                        change_schema: 'Şemayı Değiştir',
                        add_field: 'Alan Ekle',
                        add_index: 'İndeks Ekle',
                        // TODO: Translate
                        duplicate_table: 'Duplicate Table',
                        delete_table: 'Tabloyu Sil',
                    },
                },
                empty_state: {
                    title: 'Tablo yok',
                    description: 'Başlamak için bir tablo oluşturun',
                },
            },
            relationships_section: {
                relationships: 'İlişkiler',
                filter: 'Filtrele',
                add_relationship: 'İlişki Ekle',
                collapse: 'Hepsini Daralt',
                relationship: {
                    primary: 'Birincil Tablo',
                    foreign: 'Referans Tablo',
                    cardinality: 'Kardinalite',
                    delete_relationship: 'Sil',
                    relationship_actions: {
                        title: 'İşlemler',
                        delete_relationship: 'Sil',
                    },
                },
                empty_state: {
                    title: 'İlişki yok',
                    description: 'Tabloları bağlamak için bir ilişki oluşturun',
                },
            },
            dependencies_section: {
                dependencies: 'Bağımlılıklar',
                filter: 'Filtrele',
                collapse: 'Hepsini Daralt',
                dependency: {
                    table: 'Tablo',
                    dependent_table: 'Bağımlı Görünüm',
                    delete_dependency: 'Sil',
                    dependency_actions: {
                        title: 'İşlemler',
                        delete_dependency: 'Sil',
                    },
                },
                empty_state: {
                    title: 'Bağımlılık yok',
                    description: 'Başlamak için bir görünüm oluşturun',
                },
            },

            // TODO: Translate
            areas_section: {
                areas: 'Areas',
                add_area: 'Add Area',
                filter: 'Filter',
                clear: 'Clear Filter',
                no_results: 'No areas found matching your filter.',

                area: {
                    area_actions: {
                        title: 'Area Actions',
                        edit_name: 'Edit Name',
                        delete_area: 'Delete Area',
                    },
                },
                empty_state: {
                    title: 'No areas',
                    description: 'Create an area to get started',
                },
            },
        },
        toolbar: {
            zoom_in: 'Yakınlaştır',
            zoom_out: 'Uzaklaştır',
            save: 'Kaydet',
            show_all: 'Hepsini Gör',
            undo: 'Geri Al',
            redo: 'Yinele',
            reorder_diagram: 'Diyagramı Yeniden Sırala',
            highlight_overlapping_tables: 'Çakışan Tabloları Vurgula',
        },
        new_diagram_dialog: {
            database_selection: {
                title: 'Veritabanınız nedir?',
                description:
                    'Her veritabanının kendine özgü özellikleri ve yetenekleri vardır.',
                check_examples_long: 'Örnekleri Kontrol Et',
                check_examples_short: 'Örnekler',
            },
            import_database: {
                title: 'Veritabanını İçe Aktar',
                database_edition: 'Veritabanı Sürümü:',
                step_1: 'Bu komut dosyasını veritabanınızda çalıştırın:',
                step_2: 'Komut dosyası sonucunu buraya yapıştırın:',
                script_results_placeholder: 'Komut dosyası sonuçları burada...',
                ssms_instructions: {
                    button_text: 'SSMS Talimatları',
                    title: 'Talimatlar',
                    step_1: "Araçlar > Seçenekler > Sorgu Sonuçları > SQL Server'a gidin.",
                    step_2: 'Eğer "Sonuçlar Izgaraya" kullanıyorsanız, Maksimum Karakterlerin Alınması için XML olmayan veriler (9999999 olarak ayarlanmış) değiştirin.',
                },
                instructions_link:
                    'Yardıma mı ihtiyacınız var? İzlemek için tıklayın',
                check_script_result: 'Komut Dosyası Sonucunu Kontrol Et',
            },
            // TODO: Translate
            import_from_file: 'Import from File',
            cancel: 'İptal',
            back: 'Geri',
            empty_diagram: 'Boş diyagram',
            continue: 'Devam',
            import: 'İçe Aktar',
        },
        open_diagram_dialog: {
            title: 'Diyagramı Aç',
            description: 'Aşağıdaki listeden açmak için bir diyagram seçin.',
            table_columns: {
                name: 'Ad',
                created_at: 'Oluşturulma Tarihi',
                last_modified: 'Son Değiştirme',
                tables_count: 'Tablolar',
            },
            cancel: 'İptal',
            open: 'Aç',
        },

        export_sql_dialog: {
            title: 'SQL Olarak Dışa Aktar',
            description:
                'Diyagram şemanızı {{databaseType}} betiğine dışa aktarın',
            close: 'Kapat',
            loading: {
                text: 'AI, SQL oluşturuyor {{databaseType}}...',
                description: 'Bu işlem en fazla 30 saniye sürecektir.',
            },
            error: {
                message:
                    'SQL betiği oluşturulurken hata oluştu. Lütfen daha sonra tekrar deneyin veya <0>bize ulaşın</0>.',
                description:
                    "OPENAI_TOKEN'ınızı kullanabilirsiniz, kılavuzu <0>buradan</0> görebilirsiniz.",
            },
        },
        create_relationship_dialog: {
            title: 'İlişki Oluştur',
            primary_table: 'Birincil Tablo',
            primary_field: 'Birincil Alan',
            referenced_table: 'Referans Tablo',
            referenced_field: 'Referans Alan',
            primary_table_placeholder: 'Tablo seç',
            primary_field_placeholder: 'Alan seç',
            referenced_table_placeholder: 'Tablo seç',
            referenced_field_placeholder: 'Alan seç',
            no_tables_found: 'Tablo bulunamadı',
            no_fields_found: 'Alan bulunamadı',
            create: 'Oluştur',
            cancel: 'İptal',
        },
        import_database_dialog: {
            title: 'Mevcut Diyagrama İçe Aktar',
            override_alert: {
                title: 'Veritabanını İçe Aktar',
                content: {
                    alert: 'Bu diyagramı içe aktarmak mevcut tabloları ve ilişkileri etkileyecektir.',
                    new_tables:
                        '<bold>{{newTablesNumber}}</bold> yeni tablo eklenecek.',
                    new_relationships:
                        '<bold>{{newRelationshipsNumber}}</bold> yeni ilişki oluşturulacak.',
                    tables_override:
                        '<bold>{{tablesOverrideNumber}}</bold> tablo üzerine yazılacak.',
                    proceed: 'Devam etmek istiyor musunuz?',
                },
                import: 'İçe Aktar',
                cancel: 'İptal',
            },
        },
        export_image_dialog: {
            title: 'Resmi Dışa Aktar',
            description: 'Dışa aktarım için ölçek faktörünü seçin:',
            scale_1x: '1x Normal',
            scale_2x: '2x (Önerilen)',
            scale_3x: '3x',
            scale_4x: '4x',
            cancel: 'İptal',
            export: 'Dışa Aktar',
            // TODO: Translate
            advanced_options: 'Advanced Options',
            pattern: 'Include background pattern',
            pattern_description: 'Add subtle grid pattern to background.',
            transparent: 'Transparent background',
            transparent_description: 'Remove background color from image.',
        },
        new_table_schema_dialog: {
            title: 'Şema Seç',
            description:
                'Şu anda birden fazla şema görüntülenmektedir. Yeni tablo için birini seçin.',
            cancel: 'İptal',
            confirm: 'Onayla',
        },
        update_table_schema_dialog: {
            title: 'Şemayı Değiştir',
            description: 'Tablo "{{tableName}}" şemasını güncelle',
            cancel: 'İptal',
            confirm: 'Değiştir',
        },
        star_us_dialog: {
            title: 'Bize yardım et!',
            description:
                "Bizi GitHub'da yıldızlamak ister misiniz? Sadece bir tık uzakta!",
            close: 'Şimdi Değil',
            confirm: 'Tabii ki!',
        },
        // TODO: Translate
        export_diagram_dialog: {
            title: 'Export Diagram',
            description: 'Choose the format for export:',
            format_json: 'JSON',
            cancel: 'Cancel',
            export: 'Export',
            error: {
                title: 'Error exporting diagram',
                description:
                    'Something went wrong. Need help? support@chartdb.io',
            },
        },
        // TODO: Translate
        import_diagram_dialog: {
            title: 'Import Diagram',
            description: 'Paste the diagram JSON below:',
            cancel: 'Cancel',
            import: 'Import',
            error: {
                title: 'Error importing diagram',
                description:
                    'The diagram JSON is invalid. Please check the JSON and try again. Need help? support@chartdb.io',
            },
        },
        // TODO: Translate
        import_dbml_dialog: {
            example_title: 'Import Example DBML',
            title: 'Import DBML',
            description: 'Import a database schema from DBML format.',
            import: 'Import',
            cancel: 'Cancel',
            skip_and_empty: 'Skip & Empty',
            show_example: 'Show Example',
            error: {
                title: 'Error',
                description: 'Failed to parse DBML. Please check the syntax.',
            },
        },
        relationship_type: {
            one_to_one: 'Bir Bir',
            one_to_many: 'Bir Çok',
            many_to_one: 'Çok Bir',
            many_to_many: 'Çok Çok',
        },
        canvas_context_menu: {
            new_table: 'Yeni Tablo',
            new_relationship: 'Yeni İlişki',
            // TODO: Translate
            new_area: 'New Area',
        },
        table_node_context_menu: {
            edit_table: 'Tabloyu Düzenle',
            delete_table: 'Tabloyu Sil',
            duplicate_table: 'Duplicate Table', // TODO: Translate
            add_relationship: 'Add Relationship', // TODO: Translate
        },

        // TODO: Translate
        snap_to_grid_tooltip: 'Snap to Grid (Hold {{key}})',

        // TODO: Translate
        tool_tips: {
            double_click_to_edit: 'Double-click to edit',
        },

        language_select: {
            change_language: 'Dil',
        },
    },
};

export const trMetadata: LanguageMetadata = {
    nativeName: 'Türkçe',
    name: 'Turkish',
    code: 'tr',
};
