import React, { useState, useEffect } from "react";
import { StyleSheet, View, TextInput, ActivityIndicator, Dimensions } from "react-native";
import config from "../../config/config";
import List from "../../components/List/List";
import useInfiniteScroll from "../../hooks/useInfiniteScroll";
import { getMtgData } from "../../services/mtgService";
import ModalError from "../../components/Modal/Error/ModalError";
import Search from "../../components/Search/Search";
import ModalImageDetail from "../../components/Modal/ImageDetail/ModalImageDetail";

const windowDimensions = Dimensions.get("window");
let hasMoreResults = true;
let searchTerm = "";
let imageDetail;
let backgorundColorDetail = "#fff";

export default function App() {
  const [list, setList] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isImageDetailModalVisible, setIsImageDetailModalVisible] = useState(false);
  const [isFetching, setIsFetching] = useInfiniteScroll(fetchMoreListItems);

  function fetchMoreListItems() {
    const fetchData = async () => {
      try {
        const result = await getMtgData(page, searchTerm);
        const cards = result.cards;
        if (cards.length === 0) {
          setIsLoading(false);
          setIsFetching(false);
          hasMoreResults = false;
          return;
        }
        setList([...list, ...cards]);
        setPage(page + 1);
        if (cards.length < config.pageSize) {
          hasMoreResults = false;
        }
      } catch (e) {
        setError(e);
      }
      setIsLoading(false);
      setIsFetching(false);
    };
    hasMoreResults && fetchData();
  }

  useEffect(() => {
    if (page === 1 && searchTerm === "" && !isFetching) {
      onSearch();
      setPage(page + 1);
    }
  }, [page]);

  function onCloseModalError() {
    setIsModalVisible(false);
  }

  function onCloseImageDetailModal() {
    document && (document.body.style.overflow = "auto");
    setIsImageDetailModalVisible(false);
  }

  function onCardClick(cardData) {
    const color = cardData.color ? cardData.color.toLowerCase() : backgorundColorDetail;
    document && (document.body.style.overflow = "hidden");
    imageDetail = cardData.imageUrl;
    backgorundColorDetail = color;
    setIsImageDetailModalVisible(true);
  }

  function updateSearch(term = "") {
    hasMoreResults = true;
    searchTerm = term;
    setPage(1);
    setIsFetching(false);
  }

  async function onSearch(p = page, s = searchTerm) {
    setIsSearching(true);
    const result = await getMtgData(p, s);
    const cards = result.cards;
    if (!cards) return;
    setList([]);
    setList([...cards]);
    setIsSearching(false);
    searchTerm !== "" && setPage(p + 1);
    if (cards.length < config.pageSize) {
      hasMoreResults = false;
    }
  }

  function resetSearch() {
    if (searchTerm !== "") {
      updateSearch("");
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
      alignItems: "center",
      justifyContent: "center"
    },
    imagePopup: {
      top: 0,
      left: 0,
      position: "fixed",
      backgroundColor: backgorundColorDetail,
      width: windowDimensions.width,
      height: windowDimensions.height,
      alignItems: "center",
      justifyContent: "center"
    }
  });

  return (
    <View style={styles.container}>
      {!isLoading && !isSearching && (
        <Search searchCallback={onSearch} resetCallback={resetSearch} updateSearchCallback={updateSearch} />
      )}
      {isLoading || isSearching ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : list.length ? (
        <List items={list} onClick={onCardClick} />
      ) : (
        !isModalVisible && <ModalError text="No results found" visible={isModalVisible} onClose={onCloseModalError} />
      )}
      {isFetching && !isLoading && hasMoreResults && (
        <ActivityIndicator size="large" color="#0000ff" style={{ padding: 10 }} />
      )}
      {isImageDetailModalVisible && (
        <ModalImageDetail
          imageDetail={imageDetail}
          visible={isImageDetailModalVisible}
          onClose={onCloseImageDetailModal}
          styles={styles.imagePopup}
        />
      )}
      {error !== null && <ModalError text={error} visible={isModalVisible} onClose={onCloseModalError} />}
    </View>
  );
}
