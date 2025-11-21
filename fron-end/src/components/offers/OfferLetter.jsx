import { Descriptions, message, Pagination, Spin } from "antd";
import { useCallback, useEffect, useState } from "react";
import { fetchOffers } from "../../api/offer";
import { current } from "@reduxjs/toolkit";


function OfferLetter({ filters, onSelect, selectedOfferId, theme, onSend }) {
    const [offers, setOffer] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 100,
        total: 0,
    });
    const [loading, setLoading] = useState(true);
    console.log("selcetd theme: ", theme);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const offers = await fetchOffers(
                pagination.current,
                pagination.pageSize,
                1,
                filters,
                // ['theme']
            );

            if (typeof offers === "string") {
                message.error(offers);
                return;
            }

            console.log(offers.data);
            setOffer(offers.data);
            setPagination((prev) => ({
                ...prev,
                total: offers.pagination?.total,
            }));
        } catch (err) {
            console.log(err);
            message.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    }, [pagination.current, pagination.pageSize, filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return loading ? (
        <Spin />
    ) : (
        <div>
            <Descriptions
                column={1}
                style={{
                    width: "100%",
                    tableLayout: "fixed",
                }}
                bordered
            >
                {offers.map((offer) => (
                    <Descriptions.Item
                        label={
                            <div
                                onClick={() => onSelect?.(offer)}
                                style={{
                                    cursor: "pointer",
                                    width: "100%",
                                    height: "100%",
                                }}
                            >
                                Code
                            </div>
                        }
                        key={offer.id}
                        contentStyle={{
                            padding: 0,
                            backgroundColor: selectedOfferId === offer.id ? "#e6f7ff" : "transparent",
                            transition: "all 0.3s ease",
                        }}
                        labelStyle={{
                            backgroundColor: selectedOfferId === offer.id ? "#e6f7ff" : "transparent",
                            transition: "all 0.3s ease",
                        }}
                    >
                        <div
                            onClick={() => onSelect?.(offer)}
                            style={{
                                cursor: "pointer",
                                padding: "16px",
                                fontWeight: selectedOfferId === offer.id ? "bold" : "normal",
                                color: selectedOfferId === offer.id ? "#1890ff" : "inherit",
                            }}
                        >
                            {offer.title}
                        </div>
                    </Descriptions.Item>
                ))}
            </Descriptions>

            <Pagination
                style={{ width: "100%" }}
                total={pagination.total}
                current={pagination.current}
                pageSize={pagination.pageSize}
                onChange={(page, pageSize) =>
                    setPagination((prev) => ({
                        ...prev,
                        current: page,
                        pageSize,
                    }))
                }
                pageSizeOptions={["100", "150", "175", "200"]}
                showTotal={(total, range) =>
                    `${range[0]}-${range[1]} of ${total} items`
                }
                simple
            />
        </div>
    );
}

export default OfferLetter;
