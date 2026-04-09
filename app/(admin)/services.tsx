import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { useRouter } from "expo-router";

import { useInfiniteQuery } from "@tanstack/react-query";

import { getServices } from "@/lib/services/services.service";

import { useAppTheme } from "@/contexts/ThemeContext";

import {
    FontSize,
    FontWeight,
    NWTColors,
} from "@/constants/theme";

import { Service } from "@/types";

export default function ServicesScreen() {
    const router = useRouter();

    const { colors } = useAppTheme();

    const {
        data,
        isLoading,
    } = useInfiniteQuery({
        queryKey: ["services"],
        queryFn: ({ pageParam = 1 }) =>
            getServices({
                page: pageParam,
                pageSize: 20,
            }),
        initialPageParam: 1,
        getNextPageParam: (last) =>
            last.hasNextPage
                ? last.page + 1
                : undefined,
    });

    const services =
        data?.pages.flatMap(
            (page) => page.data
        ) ?? [];

    if (isLoading)
        return (
            <SafeAreaView style={s.center}>
                <ActivityIndicator size="large" />
            </SafeAreaView>
        );

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
                >
                    <Ionicons
                        name="arrow-back"
                        size={22}
                        color={colors.text}
                    />
                </TouchableOpacity>

                <Text
                    style={[
                        s.title,
                        { color: colors.text },
                    ]}
                >
                    Services
                </Text>

                <TouchableOpacity
                    onPress={() =>
                        router.push(
                            "/(admin)/create-service" as any
                        )
                    }
                >
                    <Ionicons
                        name="add"
                        size={26}
                        color={NWTColors.primary}
                    />
                </TouchableOpacity>
            </View>

            {/* List */}

            <FlatList
                data={services}
                keyExtractor={(item) => item.id}
                contentContainerStyle={s.list}
                renderItem={({ item }) => (
                    <ServiceRow
                        service={item}
                    />
                )}
                ListEmptyComponent={
                    <Text
                        style={{
                            textAlign: "center",
                            marginTop: 40,
                            color:
                                colors.textSecondary,
                        }}
                    >
                        No services yet
                    </Text>
                }
            />
        </SafeAreaView>
    );
}

function ServiceRow({
    service,
}: {
    service: Service;
}) {
    const router = useRouter();

    const { colors } = useAppTheme();

    return (
        <TouchableOpacity
            style={[
                s.row,
                {
                    backgroundColor:
                        colors.card,
                },
            ]}
            onPress={() =>
                router.push(
                    `/(admin)/edit-service/${service.id}` as any
                )
            }
        >
            <View style={{ flex: 1 }}>
                <Text
                    style={[
                        s.name,
                        { color: colors.text },
                    ]}
                >
                    {service.name}
                </Text>

                <Text
                    style={{
                        color:
                            colors.textSecondary,
                    }}
                >
                    {service.category ??
                        "Uncategorized"}{" "}
                    · UGX{" "}
                    {service.price.toLocaleString()}
                </Text>
            </View>

            <View
                style={[
                    s.statusDot,
                    {
                        backgroundColor:
                            service.status ===
                                "active"
                                ? NWTColors.success
                                : NWTColors.danger,
                    },
                ]}
            />
        </TouchableOpacity>
    );
}

const s = StyleSheet.create({
    safe: {
        flex: 1,
    },

    header: {
        height: 56,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent:
            "space-between",
    },

    title: {
        fontSize:
            FontSize.base,
        fontWeight:
            FontWeight.semibold,
    },

    list: {
        padding: 16,
    },

    row: {
        padding: 14,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "center",
    },

    name: {
        fontSize:
            FontSize.base,
        fontWeight:
            FontWeight.semibold,
    },

    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },

    center: {
        flex: 1,
        justifyContent:
            "center",
        alignItems:
            "center",
    },
});