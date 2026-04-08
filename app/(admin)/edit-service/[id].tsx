import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import {
    useLocalSearchParams,
    useRouter,
} from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import { useEffect } from "react";
import {
    Controller,
    useForm,
} from "react-hook-form";

import {
    getService,
    updateService,
} from "@/lib/services/services.service";

import {
    FontSize,
    FontWeight,
    NWTColors,
} from "@/constants/theme";

import { useAppTheme } from "@/contexts/ThemeContext";

type FormData = {
    name: string;
    price: string;
    category?: string;
};

export default function EditServiceScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { colors } = useAppTheme();

    const { id } =
        useLocalSearchParams<{ id: string }>();

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormData>();

    /*
    fetch service
    */

    const {
        data: service,
        isLoading,
    } = useQuery({
        queryKey: ["service", id],
        queryFn: () => getService(id!),
        enabled: !!id,
    });

    /*
    populate form
    */

    useEffect(() => {
        if (!service) return;

        reset({
            name: service.name,
            price: String(service.price),
            category: service.category ?? "",
        });
    }, [service, reset]);

    /*
    update mutation
    */

    const mutation = useMutation({
        mutationFn: (form: FormData) =>
            updateService(id!, {
                name: form.name,
                price: Number(form.price),
                category: form.category,
            }),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["services"],
            });

            queryClient.invalidateQueries({
                queryKey: ["service", id],
            });

            Alert.alert(
                "Success",
                "Service updated"
            );

            router.back();
        },

        onError: () =>
            Alert.alert(
                "Error",
                "Failed to update service"
            ),
    });

    /*
    loading state
    */

    if (isLoading)
        return (
            <SafeAreaView style={s.center}>
                <ActivityIndicator size="large" />
            </SafeAreaView>
        );

    /*
    submit handler
    */

    const onSubmit = (form: FormData) =>
        mutation.mutate(form);

    /*
    UI
    */

    return (
        <SafeAreaView
            style={[
                s.safe,
                {
                    backgroundColor:
                        colors.background,
                },
            ]}
        >
            {/* Header */}

            <View style={s.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={s.backBtn}
                >
                    <Ionicons
                        name="arrow-back"
                        size={22}
                        color={colors.text}
                    />
                </TouchableOpacity>

                <Text
                    style={[
                        s.headerTitle,
                        { color: colors.text },
                    ]}
                >
                    Edit Service
                </Text>

                <View style={{ width: 32 }} />
            </View>

            {/* Form */}

            <ScrollView
                contentContainerStyle={
                    s.container
                }
                showsVerticalScrollIndicator={
                    false
                }
            >
                {/* Name */}

                <Text
                    style={[
                        s.label,
                        {
                            color:
                                colors.textSecondary,
                        },
                    ]}
                >
                    Service Name
                </Text>

                <Controller
                    control={control}
                    name="name"
                    rules={{
                        required:
                            "Service name required",
                        minLength: {
                            value: 3,
                            message:
                                "Minimum 3 characters required",
                        },
                    }}
                    render={({
                        field: {
                            value,
                            onChange,
                        },
                    }) => (
                        <>
                            <TextInput
                                value={value}
                                onChangeText={onChange}
                                placeholder="Service name"
                                placeholderTextColor={
                                    colors.textSecondary
                                }
                                style={[
                                    s.input,
                                    {
                                        borderColor:
                                            errors.name
                                                ? NWTColors.danger
                                                : colors.border,
                                        color:
                                            colors.text,
                                        backgroundColor:
                                            colors.card,
                                    },
                                ]}
                            />

                            {errors.name && (
                                <Text style={s.error}>
                                    {
                                        errors.name
                                            .message
                                    }
                                </Text>
                            )}
                        </>
                    )}
                />

                {/* Price */}

                <Text
                    style={[
                        s.label,
                        {
                            color:
                                colors.textSecondary,
                        },
                    ]}
                >
                    Price (UGX)
                </Text>

                <Controller
                    control={control}
                    name="price"
                    rules={{
                        required:
                            "Price required",
                        pattern: {
                            value:
                                /^[0-9]+$/,
                            message:
                                "Price must be numeric",
                        },
                    }}
                    render={({
                        field: {
                            value,
                            onChange,
                        },
                    }) => (
                        <>
                            <TextInput
                                value={value}
                                onChangeText={onChange}
                                keyboardType="numeric"
                                placeholder="50000"
                                placeholderTextColor={
                                    colors.textSecondary
                                }
                                style={[
                                    s.input,
                                    {
                                        borderColor:
                                            errors.price
                                                ? NWTColors.danger
                                                : colors.border,
                                        color:
                                            colors.text,
                                        backgroundColor:
                                            colors.card,
                                    },
                                ]}
                            />

                            {errors.price && (
                                <Text style={s.error}>
                                    {
                                        errors.price
                                            .message
                                    }
                                </Text>
                            )}
                        </>
                    )}
                />

                {/* Category */}

                <Text
                    style={[
                        s.label,
                        {
                            color:
                                colors.textSecondary,
                        },
                    ]}
                >
                    Category
                </Text>

                <Controller
                    control={control}
                    name="category"
                    rules={{
                        maxLength: {
                            value: 30,
                            message:
                                "Category too long",
                        },
                    }}
                    render={({
                        field: {
                            value,
                            onChange,
                        },
                    }) => (
                        <>
                            <TextInput
                                value={value}
                                onChangeText={onChange}
                                placeholder="Cleaning"
                                placeholderTextColor={
                                    colors.textSecondary
                                }
                                style={[
                                    s.input,
                                    {
                                        borderColor:
                                            errors.category
                                                ? NWTColors.danger
                                                : colors.border,
                                        color:
                                            colors.text,
                                        backgroundColor:
                                            colors.card,
                                    },
                                ]}
                            />

                            {errors.category && (
                                <Text style={s.error}>
                                    {
                                        errors.category
                                            .message
                                    }
                                </Text>
                            )}
                        </>
                    )}
                />

                {/* Submit */}

                <TouchableOpacity
                    style={s.button}
                    onPress={handleSubmit(
                        onSubmit
                    )}
                    disabled={
                        mutation.isPending
                    }
                >
                    <Text style={s.buttonText}>
                        {mutation.isPending
                            ? "Updating..."
                            : "Update Service"}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: {
        flex: 1,
    },

    header: {
        height: 56,
        flexDirection: "row",
        alignItems: "center",
        justifyContent:
            "space-between",
        paddingHorizontal: 16,
    },

    backBtn: {
        width: 32,
    },

    headerTitle: {
        fontSize:
            FontSize.base,
        fontWeight:
            FontWeight.semibold,
    },

    container: {
        padding: 16,
        paddingBottom: 40,
    },

    label: {
        fontSize:
            FontSize.sm,
        marginBottom: 6,
        marginTop: 14,
    },

    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize:
            FontSize.base,
    },

    error: {
        color:
            NWTColors.danger,
        fontSize: 12,
        marginTop: 4,
    },

    button: {
        marginTop: 28,
        backgroundColor:
            NWTColors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
    },

    buttonText: {
        color: "white",
        fontSize:
            FontSize.base,
        fontWeight:
            FontWeight.semibold,
    },

    center: {
        flex: 1,
        justifyContent:
            "center",
        alignItems:
            "center",
    },
});