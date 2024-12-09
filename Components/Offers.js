import React from "react";
import { View, StyleSheet, FlatList, Dimensions } from "react-native";
import { Card, Text } from "react-native-paper";

const {width: screenWidth} = Dimensions.get('window');

const list = [
    {
        id:1,
        title:"Tarjous 1",
        image:'https://firebasestorage.googleapis.com/v0/b/koirakaweri.appspot.com/o/tarjous1.png?alt=media&token=40bae1b1-f5ec-4171-86b5-990c274db78d'
    },
    {
        id:1,
        title:"Tarjous 2",
        image:'https://firebasestorage.googleapis.com/v0/b/koirakaweri.appspot.com/o/tarjous2.png?alt=media&token=6fba26f1-15da-49fd-a628-209dc62edf40'
    },

]

const Offers = () => {

    return(
        <View style={styles.offerContainer}>
            <FlatList
            data={list}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item}) => (
                <Card style={styles.card}>
                    <Card.Cover
                    source={{uri: item.image}}
                    />
                <Card.Content>
                    <Text style={styles.title}>{item. title}</Text>
                </Card.Content>
                  
                </Card>
            )}
            />
        </View>
    )

}

const styles = StyleSheet.create({
    offerContainer: {
      marginTop: 20,
      height: 250,
    },
    card: {
      width: screenWidth * 0.5,
      marginHorizontal: 10,
      borderRadius: 10,
      elevation: 3,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      marginTop: 10,
    },

  });
export default Offers;
