import type { LanguageMetadata, LanguageTranslation } from '../types';

export const tr: LanguageTranslation = {
    translation: {
        editor_sidebar: {
            new_diagram: 'Yeni',
            browse: 'Gözat',
            tables: 'Tablolar',
            refs: 'Refs',
            dependencies: 'Bağımlılıklar',
            custom_types: 'Özel Tipler',
            visuals: 'Görseller',
        },
        menu: {
            actions: {
                actions: 'Eylemler',
                new: 'Yeni...',
                browse: 'Gözat...',
                save: 'Kaydet',
                import: 'Veritabanı İçe Aktar',
                export_sql: 'SQL Olarak Dışa Aktar',
                export_as: 'Olarak Dışa Aktar',
                delete_diagram: 'Sil',
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
                show_field_attributes: 'Alan Özelliklerini Göster',
                hide_field_attributes: 'Alan Özelliklerini Gizle',
                zoom_on_scroll: 'Kaydırarak Yakınlaştır',
                show_views: 'Veritabanı Görünümleri',
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
            title: 'Diyagramı Otomatik Düzenle',
            description:
                'Bu işlem tüm tabloları yeniden düzenleyecektir. Devam etmek istiyor musunuz?',
            reorder: 'Otomatik Düzenle',
            cancel: 'İptal',
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
            view_all_options: 'Tüm Seçenekleri Gör...',
            tables_section: {
                tables: 'Tablolar',
                add_table: 'Tablo Ekle',
                add_view: 'Görünüm Ekle',
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
                        auto_increment: 'Otomatik Artış',
                        comments: 'Yorumlar',
                        no_comments: 'Yorum yok',
                        delete_field: 'Alanı Sil',
                        // TODO: Translate
                        default_value: 'Default Value',
                        no_default: 'No default',
                        // TODO: Translate
                        character_length: 'Max Length',
                        precision: 'Hassasiyet',
                        scale: 'Ölçek',
                    },
                    index_actions: {
                        title: 'İndeks Özellikleri',
                        name: 'Ad',
                        unique: 'Tekil',
                        index_type: 'İndeks Türü',
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
            refs_section: {
                refs: 'Refs',
                filter: 'Filtrele',
                collapse: 'Hepsini Daralt',
                add_relationship: 'İlişki Ekle',
                relationships: 'İlişkiler',
                dependencies: 'Bağımlılıklar',
                relationship: {
                    relationship: 'İlişki',
                    primary: 'Birincil Tablo',
                    foreign: 'Referans Tablo',
                    cardinality: 'Kardinalite',
                    delete_relationship: 'Sil',
                    relationship_actions: {
                        title: 'İşlemler',
                        delete_relationship: 'Sil',
                    },
                },
                dependency: {
                    dependency: 'Bağımlılık',
                    table: 'Tablo',
                    dependent_table: 'Bağımlı Görünüm',
                    delete_dependency: 'Sil',
                    dependency_actions: {
                        title: 'İşlemler',
                        delete_dependency: 'Sil',
                    },
                },
                empty_state: {
                    title: 'İlişki yok',
                    description: 'Başlamak için bir ilişki oluşturun',
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

            visuals_section: {
                visuals: 'Görseller',
                tabs: {
                    areas: 'Areas',
                    notes: 'Notlar',
                },
            },

            notes_section: {
                filter: 'Filtrele',
                add_note: 'Not Ekle',
                no_results: 'Not bulunamadı',
                clear: 'Filtreyi Temizle',
                empty_state: {
                    title: 'Not Yok',
                    description:
                        'Tuval üzerinde metin açıklamaları eklemek için bir not oluşturun',
                },
                note: {
                    empty_note: 'Boş not',
                    note_actions: {
                        title: 'Not İşlemleri',
                        edit_content: 'İçeriği Düzenle',
                        delete_note: 'Notu Sil',
                    },
                },
            },

            // TODO: Translate
            custom_types_section: {
                custom_types: 'Custom Types',
                filter: 'Filter',
                clear: 'Clear Filter',
                no_results: 'No custom types found matching your filter.',
                empty_state: {
                    title: 'No custom types',
                    description:
                        'Custom types will appear here when they are available in your database',
                },
                custom_type: {
                    kind: 'Kind',
                    enum_values: 'Enum Values',
                    composite_fields: 'Fields',
                    no_fields: 'No fields defined',
                    no_values: 'Tanımlanmış enum değeri yok',
                    field_name_placeholder: 'Field name',
                    field_type_placeholder: 'Select type',
                    add_field: 'Add Field',
                    no_fields_tooltip: 'No fields defined for this custom type',
                    custom_type_actions: {
                        title: 'Actions',
                        highlight_fields: 'Highlight Fields',
                        delete_custom_type: 'Delete',
                        clear_field_highlight: 'Clear Highlight',
                    },
                    delete_custom_type: 'Delete Type',
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
            reorder_diagram: 'Diyagramı Otomatik Düzenle',
            // TODO: Translate
            clear_custom_type_highlight: 'Clear highlight for "{{typeName}}"',
            custom_type_highlight_tooltip:
                'Highlighting "{{typeName}}" - Click to clear',
            highlight_overlapping_tables: 'Çakışan Tabloları Vurgula',
            // TODO: Translate
            filter: 'Filter Tables',
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
                step_2: 'Komut dosyası sonucunu buraya yapıştırın →',
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
            empty_diagram: 'Boş veritabanı',
            continue: 'Devam',
            import: 'İçe Aktar',
        },
        open_diagram_dialog: {
            title: 'Veritabanı Aç',
            description: 'Aşağıdaki listeden açmak için bir diyagram seçin.',
            table_columns: {
                name: 'Ad',
                created_at: 'Oluşturulma Tarihi',
                last_modified: 'Son Değiştirme',
                tables_count: 'Tablolar',
            },
            cancel: 'İptal',
            open: 'Aç',

            diagram_actions: {
                open: 'Aç',
                duplicate: 'Kopyala',
                delete: 'Sil',
            },
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

        create_table_schema_dialog: {
            title: 'Yeni Şema Oluştur',
            description:
                'Henüz hiç şema mevcut değil. Tablolarınızı düzenlemek için ilk şemanızı oluşturun.',
            create: 'Oluştur',
            cancel: 'İptal',
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
            new_view: 'Yeni Görünüm',
            new_relationship: 'Yeni İlişki',
            // TODO: Translate
            new_area: 'New Area',
            new_note: 'Yeni Not',
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

        on: 'Açık',
        off: 'Kapalı',
    },
};

export const trMetadata: LanguageMetadata = {
    nativeName: 'Türkçe',
    name: 'Turkish',
    code: 'tr',
};
